document.addEventListener('DOMContentLoaded', function() {
    /*******************************
     * Úverové boxy – Čisté refinancovanie
     *******************************/
    const loansContainer = document.getElementById('loansContainer');
    const addLoanBtn = document.getElementById('addLoan');

    function createLoanBox() {
        const loanDiv = document.createElement('div');
        loanDiv.className = 'loan-box';
        loanDiv.innerHTML = `
      <button class="delete-loan" title="Odstrániť úver">
        <i class="fa fa-trash"></i>
      </button>
      <div class="input-group">
        <label>Typ úveru:</label>
        <select class="loan-type">
          <option value="hypoteka">Hypotéka</option>
          <option value="spotrebny">Spotrebný úver</option>
          <option value="leasing">Leasing</option>
          <option value="iny">Iný úver</option>
        </select>
      </div>
      <div class="input-group">
        <label>Zostatok úveru:</label>
        <input type="number" class="loan-balance" placeholder="Zostatok">
      </div>
      <div class="input-group">
        <label>Doba splácania:</label>
        <select class="loan-duration">
          <option value="0-9">0–9 mesiacov</option>
          <option value="10-11">10–11 mesiacov</option>
          <option value="12-13">12–13 mesiacov</option>
          <option value="14-17">14–17 mesiacov</option>
          <option value="18+">18+ mesiacov</option>
        </select>
      </div>
      <div class="input-group">
        <label>Aktuálna mesačná splátka:</label>
        <input type="number" class="loan-current-payment" placeholder="Splátka">
      </div>
    `;
        const deleteLoanBtn = loanDiv.querySelector('.delete-loan');
        deleteLoanBtn.addEventListener('click', () => {
            loanDiv.remove();
        });
        loansContainer.appendChild(loanDiv);
    }

    // Predvolene vytvor jeden úverový box
    if (loansContainer.children.length === 0) {
        createLoanBox();
    }

    addLoanBtn.addEventListener('click', () => {
        createLoanBox();
    });

    /*******************************
     * Výpočet bankových ponúk pre refinancovanie
     *******************************/
    const calculateRefiBtn = document.getElementById('calculateRefi');
    const resetRefiBtn = document.getElementById('resetRefi');
    const bankOffersContainer = document.getElementById('bankOffersContainer');

    calculateRefiBtn.addEventListener('click', () => {
        const loanDivs = loansContainer.querySelectorAll('.loan-box');
        if (loanDivs.length === 0) {
            alert('Prosím, pridajte aspoň jeden úver.');
            return;
        }

        let totalRemaining = 0;
        let totalCurrentPayment = 0;
        let minDurationCategory = 999;

        // Premenné pre typy úverov
        let totalHypoteka = 0, totalSpotrebny = 0, totalLeasing = 0;
        let countLoans = 0, countHypoteka = 0, countSpotrebny = 0, countLeasing = 0;

        loanDivs.forEach(div => {
            const balance = parseFloat(div.querySelector('.loan-balance').value) || 0;
            const currentPayment = parseFloat(div.querySelector('.loan-current-payment').value) || 0;
            const durationStr = div.querySelector('.loan-duration').value;
            let durationNum;
            if (durationStr === "0-9") durationNum = 9;
            else if (durationStr === "10-11") durationNum = 11;
            else if (durationStr === "12-13") durationNum = 13;
            else if (durationStr === "14-17") durationNum = 17;
            else if (durationStr === "18+") durationNum = 18;

            if (durationNum < minDurationCategory) minDurationCategory = durationNum;
            totalRemaining += balance;
            totalCurrentPayment += currentPayment;
            countLoans++;

            const type = div.querySelector('.loan-type').value;
            if (type === "hypoteka") {
                totalHypoteka += balance;
                countHypoteka++;
            } else if (type === "spotrebny") {
                totalSpotrebny += balance;
                countSpotrebny++;
            } else if (type === "leasing") {
                totalLeasing += balance;
                countLeasing++;
            }
        });

        const desiredTermYears = parseFloat(document.getElementById('desiredTerm').value) || 25;
        const termMonths = desiredTermYears * 12;
        const propertyValue = parseFloat(document.getElementById('propertyValue').value) || 0;
        const hasEmployment = document.getElementById('employmentStatus').checked;
        const propertyType = document.getElementById('propertyType').value;  // "byt" alebo "dom"

        console.log("Property Value:", propertyValue, "Employment:", hasEmployment, "Property Type:", propertyType);

        // Definícia bánk s LTV podmienkami
        const refiBanks = [
            { name: "SLSP", rate: 4.09, minDuration: 12, ltvByt: 0.90, ltvDom: 0.90 },
            { name: "VÚB", rate: (totalRemaining > 200000 ? 3.89 : (totalRemaining >= 100000 ? 3.99 : 4.09)), minDuration: 12, ltvByt: 0.80, ltvDom: 0.70 },
            { name: "Tatra", rate: 3.65, minDuration: 10, ltvByt: 0.90, ltvDom: 0.90 },
            { name: "ČSOB", rate: 3.45, minDuration: 12, ltvByt: 0.90, ltvDom: 0.90 },
            { name: "Prima", rate: 3.30, minDuration: 16, ltvByt: 1.00, ltvDom: 1.00 },
            { name: "Unicredit", rate: 3.69, minDuration: 18, ltvByt: 0.80, ltvDom: 0.80 },
            { name: "365 banka", rate: 3.75, minDuration: 10, ltvByt: 0.80, ltvDom: 0.80 },
            { name: "mBank", rate: 3.79, minDuration: 12, ltvByt: 0.80, ltvDom: 0.80 }
        ];

        bankOffersContainer.innerHTML = '';
        let eligibleCount = 0;

        refiBanks.forEach(bank => {
            const reasons = [];
            // Kontrola minimálnej doby splácania
            if (minDurationCategory < bank.minDuration) {
                reasons.push("krátkej dobe splácania");
            }

            // LTV kontrola: maximálna povolená suma
            const allowedMax = propertyType === "dom"
                ? Math.min(propertyValue * bank.ltvDom, bank.name === "Unicredit" ? 180000 : Infinity)
                : Math.min(propertyValue * bank.ltvByt, bank.name === "Unicredit" ? 180000 : Infinity);
            if (totalRemaining > allowedMax) {
                reasons.push("prekročený LTV");
            }

            // Extra podmienky pre banky
            if (bank.name === "VÚB") {
                if (totalRemaining > 0) {
                    let ratioHyp = totalHypoteka / totalRemaining;
                    let ratioSpot = totalSpotrebny / totalRemaining;
                    if (ratioHyp < 0.60) {
                        reasons.push("podiel hypoték < 60%");
                    }
                    if (ratioSpot > 0.40) {
                        reasons.push("podiel spotrebných > 40%");
                    }
                }
            }
            if (bank.name === "Tatra") {
                if (totalRemaining > 0) {
                    let ratioHyp = totalHypoteka / totalRemaining;
                    let ratioUnsec = (totalRemaining - totalHypoteka) / totalRemaining;
                    if (ratioHyp < 0.80) {
                        reasons.push("secured ratio < 80%");
                    }
                    if (ratioUnsec > 0.20) {
                        reasons.push("unsecured ratio > 20%");
                    }
                }
            }
            if (bank.name === "ČSOB") {
                reasons.push("ČSOB už neposkytuje nikdy čisté refinancovanie");
            }
            if (bank.name === "Prima") {
                if (totalRemaining > 0) {
                    let ratioHyp = totalHypoteka / totalRemaining;
                    if (ratioHyp < 0.80) {
                        reasons.push("secured ratio < 80%");
                    }
                }
            }
            if (bank.name === "Unicredit") {
                if (countLoans !== countHypoteka) {
                    reasons.push("iba hypotekárne úvery povolené");
                }
            }
            if (bank.name === "365 banka") {
                if (countSpotrebny > 2) {
                    reasons.push("max. 2 spotrebné úvery");
                }
            }
            if (bank.name === "mBank") {
                if (countLoans > 5) {
                    reasons.push("max. 5 úverov");
                }
                if (totalRemaining > 0 && ((totalSpotrebny + totalLeasing) / totalRemaining > 0.30)) {
                    reasons.push("spotrebné a leasing > 30%");
                }
            }

            // Výpočet novej mesačnej splátky
            const newMonthly = calcMonthlyPayment(totalRemaining, bank.rate, termMonths);

            // Kontrola mesačnej splátky oproti aktuálnej
            if (minDurationCategory < 12) {
                if (newMonthly >= totalCurrentPayment) {
                    reasons.push("vyššej mesačnej splátke oproti aktuálnej");
                }
            } else {
                if (bank.name === "Prima") {
                    if (newMonthly > totalCurrentPayment * 1.20) {
                        reasons.push("vyššej mesačnej splátke oproti aktuálnej");
                    }
                } else {
                    if (newMonthly >= totalCurrentPayment) {
                        reasons.push("vyššej mesačnej splátke oproti aktuálnej");
                    }
                }
            }

            let qualifies = reasons.length === 0;

            // Vytvorenie kartičky pre banku
            const card = document.createElement('div');
            card.className = 'bank-card';

            // Ľavá sekcia: názov banky
            const cardLeft = document.createElement('div');
            cardLeft.className = 'bank-card-left';
            const iconDiv = document.createElement('div');
            iconDiv.className = 'bank-card-icon';
            const contentDiv = document.createElement('div');
            contentDiv.className = 'bank-card-content';
            const bankNameEl = document.createElement('div');
            bankNameEl.className = 'bank-name';
            bankNameEl.textContent = bank.name;
            contentDiv.appendChild(bankNameEl);
            cardLeft.appendChild(iconDiv);
            cardLeft.appendChild(contentDiv);

            // Stredná sekcia: úrok a splátka
            const cardCenter = document.createElement('div');
            cardCenter.className = 'bank-card-center';

            // Pravá sekcia: tlačidlo alebo chybová hláška
            const cardRight = document.createElement('div');
            cardRight.className = 'bank-card-right';

            if (qualifies) {
                // Banka vyhovuje
                eligibleCount++;
                const rateEl = document.createElement('div');
                rateEl.className = 'bank-rate';
                rateEl.textContent = `${bank.rate.toFixed(2)} %`;

                const monthlyEl = document.createElement('div');
                monthlyEl.className = 'bank-monthly';
                monthlyEl.textContent = `Splátka: ${newMonthly.toFixed(2)} €`;

                cardCenter.appendChild(rateEl);
                cardCenter.appendChild(monthlyEl);

                const btnRefi = document.createElement('button');
                btnRefi.className = 'btn-refinance';
                btnRefi.textContent = "Chcem refinancovať";
                btnRefi.addEventListener('click', () => {
                    alert(`Preposielam na formulár pre banku ${bank.name}`);
                });
                cardRight.appendChild(btnRefi);
            } else {
                // Banka nevyhovuje
                const statusEl = document.createElement('div');
                statusEl.className = 'bank-status-error';

                if (bank.name === "ČSOB") {
                    statusEl.textContent = "ČSOB už neposkytuje nikdy čisté refinancovanie";
                } else {
                    statusEl.textContent = "nedá sa refinancovať bez overenia výšky príjmu";
                }

                const infoIcon = document.createElement('i');
                infoIcon.className = "fa fa-info-circle";
                infoIcon.title = `Kvôli ${reasons.join(" a ")}`;

                statusEl.appendChild(infoIcon);
                cardRight.appendChild(statusEl);
            }

            card.appendChild(cardLeft);
            card.appendChild(cardCenter);
            card.appendChild(cardRight);
            bankOffersContainer.appendChild(card);
        });

        if (eligibleCount === 0) {
            alert("V tejto situácii nevyhovuje žiadna banka. Je potrebné doplniť údaje o finančnej situácii.");
        } else {
            const displayedBanksCount = refiBanks.filter(b => minDurationCategory >= b.minDuration).length;
            if (eligibleCount < displayedBanksCount) {
                alert("Nie všetky banky ponúkajú refinancovanie za výhodnejších podmienok. Pre ponuky vo zvyšných bankách je potrebné overiť výšku príjmu a doplniť dodatočné údaje.");
            }
        }
    });

    resetRefiBtn.addEventListener('click', () => {
        resetRefiBtn.classList.add('animate-reset');
        setTimeout(() => {
            resetRefiBtn.classList.remove('animate-reset');
        }, 600);

        loansContainer.innerHTML = '';
        document.getElementById('desiredTerm').value = 25;
        document.getElementById('propertyValue').value = 0;
        document.getElementById('employmentStatus').checked = false;
        bankOffersContainer.innerHTML = '';

        if (loansContainer.children.length === 0) {
            createLoanBox();
        }
    });

    function calcMonthlyPayment(principal, annualRate, termMonths) {
        const r = annualRate / 100 / 12;
        return principal * (r / (1 - Math.pow(1 + r, -termMonths)));
    }
});