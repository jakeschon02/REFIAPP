document.addEventListener('DOMContentLoaded', function() {
    /*******************************
     * Prepínanie režimov (taby)
     *******************************/
    const modeTabs = document.getElementById('modeTabs');
    const tabItems = modeTabs.querySelectorAll('.tab-item');
    const modeNova = document.getElementById('mode-nova-hypoteka');
    const modeRefi = document.getElementById('mode-refinancovanie');
    const modeNavy = document.getElementById('mode-navysenie');

    // Sekcia pre zobrazenie / skrytie výsledkov Novej hypotéky
    const novaHypotekaResults = document.getElementById('novaHypotekaResults');
    // Nadpis pre banky
    const bankOffersTitle = document.getElementById('bankOffersTitle');

    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            tabItems.forEach(t => t.classList.remove('is-active'));
            tab.classList.add('is-active');

            const mode = tab.getAttribute('data-mode');
            modeNova.style.display = 'none';
            modeRefi.style.display = 'none';
            modeNavy.style.display = 'none';

            if (mode === 'nova-hypoteka') {
                modeNova.style.display = 'block';
                novaHypotekaResults.style.display = 'block';
                bankOffersTitle.textContent = "Porovnanie bánk";
            } else if (mode === 'refinancovanie') {
                modeRefi.style.display = 'block';
                novaHypotekaResults.style.display = 'none';
                bankOffersTitle.textContent = "Porovnanie bánk";
            } else if (mode === 'navysenie') {
                modeNavy.style.display = 'block';
                novaHypotekaResults.style.display = 'none';
                bankOffersTitle.textContent = "Porovnanie bánk";
            }
        });
    });

    /*******************************
     * Pridávanie žiadateľov (Nová hypotéka)
     *******************************/
    const applicantsContainer = document.getElementById('applicants');
    const addApplicantBtn = document.getElementById('addApplicant');

    addApplicantBtn.addEventListener('click', () => {
        const applicantDiv = document.createElement('div');
        applicantDiv.className = 'applicant-box';
        applicantDiv.innerHTML = `
      <button class="delete-applicant" title="Odstrániť žiadateľa">
        <i class="fa fa-user-minus"></i>
      </button>
      <div class="input-group">
        <label>Meno:</label>
        <input type="text" class="applicant-name" placeholder="Meno">
      </div>
      <div class="input-group">
        <label>Vek:</label>
        <input type="number" class="applicant-age" placeholder="Vek">
      </div>
      <div class="input-group">
        <label>Typ príjmu:</label>
        <select class="applicant-type">
          <option value="TPP">TPP (zamestnanec)</option>
          <option value="SZČO">SZČO</option>
          <option value="sro">s.r.o.</option>
        </select>
      </div>
      <div class="input-group income-field" data-type="TPP">
        <label>Mesačný čistý príjem:</label>
        <input type="number" class="applicant-income" placeholder="Mesačný príjem">
      </div>
      <div class="input-group income-field" data-type="SZČO" style="display:none;">
        <label>Ročné tržby:</label>
        <input type="number" class="applicant-revenue" placeholder="Ročné tržby">
      </div>
      <div class="input-group income-field" data-type="sro" style="display:none;">
        <label>Zisk po zdanení:</label>
        <input type="number" class="applicant-profit" placeholder="Zisk po zdanení">
      </div>
    `;
        const deleteBtn = applicantDiv.querySelector('.delete-applicant');
        deleteBtn.addEventListener('click', () => {
            applicantDiv.remove();
        });
        const typeSelect = applicantDiv.querySelector('.applicant-type');
        typeSelect.addEventListener('change', () => {
            const selected = typeSelect.value;
            applicantDiv.querySelectorAll('.income-field').forEach(field => {
                field.style.display = (field.getAttribute('data-type') === selected) ? 'block' : 'none';
            });
        });
        applicantsContainer.appendChild(applicantDiv);
    });

    /*******************************
     * Výpočet pre "Nová hypotéka"
     *******************************/
    const calculateBtn = document.getElementById('calculate');
    const resetBtn = document.getElementById('reset');
    const resultMonthly = document.getElementById('resultMonthly');
    const resultDTSI = document.getElementById('resultDTSI');
    const resultDTI = document.getElementById('resultDTI');
    const resultFinal = document.getElementById('resultFinal');

    calculateBtn.addEventListener('click', () => {
        // Pridanie animácie pre tlačidlo "Vypočítať"
        calculateBtn.classList.add('animate-calc');
        setTimeout(() => {
            calculateBtn.classList.remove('animate-calc');
        }, 1000);

        const childrenUnder15 = parseFloat(document.getElementById('childrenUnder15').value) || 0;
        const children15plus = parseFloat(document.getElementById('children15plus').value) || 0;
        const mealVoucher = parseFloat(document.getElementById('mealVoucher').value) || 0;

        const applicantDivs = applicantsContainer.querySelectorAll('.applicant-box');
        if (applicantDivs.length === 0) {
            alert('Prosím, pridajte aspoň jedného žiadateľa.');
            return;
        }

        let totalEffectiveIncome = 0;
        let multipliers = [];
        applicantDivs.forEach(div => {
            const type = div.querySelector('.applicant-type').value;
            const age = parseFloat(div.querySelector('.applicant-age').value) || 0;
            let effectiveIncome = 0;
            if (type === 'TPP') {
                effectiveIncome = parseFloat(div.querySelector('.applicant-income').value) || 0;
            } else if (type === 'SZČO') {
                const revenue = parseFloat(div.querySelector('.applicant-revenue').value) || 0;
                const deduction = (revenue <= 48441.43) ? 0.19 : 0.25;
                effectiveIncome = (revenue * (1 - deduction)) / 12;
            } else if (type === 'sro') {
                const profit = parseFloat(div.querySelector('.applicant-profit').value) || 0;
                let taxRate = 0.10;
                if (profit > 100000 && profit < 5000000) {
                    taxRate = 0.21;
                } else if (profit >= 5000000) {
                    taxRate = 0.24;
                }
                effectiveIncome = (profit * (1 - taxRate)) / 12;
            }
            totalEffectiveIncome += effectiveIncome;
            let multiplier = 8;
            if (age >= 41) {
                multiplier = 8 - ((age - 40) * 0.25);
                if (multiplier < 3) multiplier = 3;
            }
            multipliers.push(multiplier);
        });

        const bonus = (childrenUnder15 * 100) + (children15plus * 50) + mealVoucher;
        const totalMonthlyIncome = totalEffectiveIncome + bonus;
        const numApplicants = applicantDivs.length;
        const totalChildren = childrenUnder15 + children15plus;
        const lifeMinimum = 280 + ((numApplicants - 1) * 200) + (totalChildren * 125);
        const availableInstallment = totalMonthlyIncome - lifeMinimum;
        const monthlyInstallment = availableInstallment * 0.6;
        const dtsi = monthlyInstallment * 168.1812;
        const combinedAnnualIncome = totalMonthlyIncome * 12;
        const minMultiplier = Math.min(...multipliers);
        const dti = minMultiplier * combinedAnnualIncome;
        const finalMortgage = Math.floor(Math.min(dtsi, dti));

        resultMonthly.textContent = monthlyInstallment.toFixed(2) + ' €';
        resultDTSI.textContent = dtsi.toFixed(2) + ' €';
        resultDTI.textContent = dti.toFixed(2) + ' €';
        resultFinal.textContent = finalMortgage.toFixed(0) + ' €';
    });

    resetBtn.addEventListener('click', () => {
        // Animácia pre tlačidlo "Reset"
        resetBtn.classList.add('animate-reset');
        setTimeout(() => {
            resetBtn.classList.remove('animate-reset');
        }, 500);

        applicantsContainer.innerHTML = '';
        document.getElementById('childrenUnder15').value = 0;
        document.getElementById('children15plus').value = 0;
        document.getElementById('mealVoucher').value = 0;
        resultMonthly.textContent = '0 €';
        resultDTSI.textContent = '0 €';
        resultDTI.textContent = '0 €';
        resultFinal.textContent = '0 €';
    });

    /*******************************
     * Pridávanie úverov (Čisté refinancovanie)
     *******************************/
    const loansContainer = document.getElementById('loansContainer');
    const addLoanBtn = document.getElementById('addLoan');

    addLoanBtn.addEventListener('click', () => {
        const loanDiv = document.createElement('div');
        loanDiv.className = 'loan-box';
        loanDiv.innerHTML = `
      <button class="delete-loan" title="Odstrániť úver">
        <i class="fa fa-trash"></i>
      </button>
      <div class="input-group">
        <label>Zostatok úveru (EUR):</label>
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
        <label>Aktuálna mesačná splátka (EUR):</label>
        <input type="number" class="loan-current-payment" placeholder="Splátka">
      </div>
    `;
        const deleteLoanBtn = loanDiv.querySelector('.delete-loan');
        deleteLoanBtn.addEventListener('click', () => {
            loanDiv.remove();
        });
        loansContainer.appendChild(loanDiv);
    });

    /*******************************
     * Výpočet pre "Čisté refinancovanie"
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
        });

        const desiredTermYears = parseFloat(document.getElementById('desiredTerm').value) || 25;
        const termMonths = desiredTermYears * 12;
        const propertyValue = parseFloat(document.getElementById('propertyValue').value) || 0;
        const hasEmployment = document.getElementById('employmentStatus').checked;

        console.log("Property Value:", propertyValue, "Employment:", hasEmployment);

        // Banky s minimálnou dobou splácania
        const refiBanks = [
            { name: "SLSP", rate: 4.09, minDuration: 12 },
            { name: "VÚB", rate: (totalRemaining > 200000 ? 3.89 : (totalRemaining >= 100000 ? 3.99 : 4.09)), minDuration: 12 },
            { name: "Tatra", rate: 3.65, minDuration: 10 },
            { name: "ČSOB", rate: 3.45, minDuration: 12 },
            { name: "Prima", rate: 3.30, minDuration: 16 },
            { name: "Unicredit", rate: 3.69, minDuration: 18 },
            { name: "365 banka", rate: 3.75, minDuration: 10 },
            { name: "mBank", rate: 3.79, minDuration: 12 }
        ];

        bankOffersContainer.innerHTML = '';
        let eligibleCount = 0;

        refiBanks.forEach(bank => {
            const reasons = [];
            if (minDurationCategory < bank.minDuration) {
                reasons.push("krátkej dobe splácania");
            }

            const newMonthly = calcMonthlyPayment(totalRemaining, bank.rate, termMonths);
            let qualifies = true;

            if (minDurationCategory < 12) {
                if (newMonthly >= totalCurrentPayment) {
                    reasons.push("vyššej mesačnej splátke oproti aktuálnej");
                    qualifies = false;
                }
            } else {
                if (bank.name === "Prima") {
                    if (newMonthly > totalCurrentPayment * 1.20) {
                        reasons.push("vyššej mesačnej splátke oproti aktuálnej");
                        qualifies = false;
                    }
                } else {
                    if (newMonthly >= totalCurrentPayment) {
                        reasons.push("vyššej mesačnej splátke oproti aktuálnej");
                        qualifies = false;
                    }
                }
            }

            if (reasons.length > 0) {
                qualifies = false;
            }

            // Vytvorenie kartičky
            const card = document.createElement('div');
            card.className = 'bank-card';

            // Ľavá sekcia: logo a názov banky
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
                const statusEl = document.createElement('div');
                statusEl.className = 'bank-status-error';
                statusEl.textContent = "nedá sa refinancovať bez overenia výšky príjmu";

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
        loansContainer.innerHTML = '';
        document.getElementById('desiredTerm').value = 25;
        document.getElementById('propertyValue').value = 0;
        document.getElementById('employmentStatus').checked = false;
        bankOffersContainer.innerHTML = '';
    });

    // Anuitný vzorec pre výpočet mesačnej splátky
    function calcMonthlyPayment(principal, annualRate, termMonths) {
        const r = annualRate / 100 / 12;
        return principal * (r / (1 - Math.pow(1 + r, -termMonths)));
    }
});