document.addEventListener("DOMContentLoaded", function () {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    const formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
        signDisplay: "always",
    });

    const list = document.getElementById("transactionList");
    const form = document.getElementById("transactionForm");
    const status = document.getElementById("status");
    const balance = document.getElementById("balance");
    const income = document.getElementById("income");
    const expense = document.getElementById("expense");

    form.addEventListener("submit", addTransaction);

    window.onload = function () {
        var storedBudget = localStorage.getItem('budget');
        var budgetAmountSpan = document.getElementById('budget-amount');
        var totalAmountDiv = document.querySelector('.total-amount');
        if (storedBudget) {
            budgetAmountSpan.innerText = storedBudget;
            totalAmountDiv.style.display = 'none';
        }
    }
    document.getElementById("set-budget-button").addEventListener("click", function () {
        if (updateBudget() && emptyField(document.getElementById('total-amount-input'), document.getElementById('budget-warning'))) {
            console.log("Budget updated successfully and field is not empty.");
        } else {
            console.log("Failed to update budget or field is empty.");
        }
    });

    var totalAmountInput = document.getElementById('total-amount-input');
    var budgetWarning = document.getElementById('budget-warning');
    totalAmountInput.addEventListener("input", function () {
        emptyField(totalAmountInput, budgetWarning);
    });

    function updateBudget() {
        var budgetValue = document.getElementById('total-amount-input').value.trim();
        var budgetAmountSpan = document.getElementById('budget-amount');
        var budgetWarningDiv = document.getElementById('budget-warning');
        var totalAmountDiv = document.querySelector('.total-amount');
        var budgetNumber = parseFloat(budgetValue);
        if (!isNaN(budgetNumber) && isFinite(budgetNumber)) {
            budgetAmountSpan.innerText = formatter.format(budgetNumber);
            localStorage.setItem('budget', budgetNumber);
            totalAmountDiv.style.display = 'none';
            console.log("Budget value:", budgetNumber);
            return true;
        } else {
            showBudgetWarning('budget-warning', "INVALID INPUT FOR BUDGET VALUE, THIS IS A REQUIRED FIELD!");
            console.log("Invalid input for budget value:", budgetValue);
            return false;
        }
    }

    function showBudgetWarning(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.classList.add('warning-red');
        element.style.display = 'block';
    }

    function updateTotal() {
        const budgetValue = localStorage.getItem('budget');
        const budgetRemainingElement = document.getElementById('budget-remaining');
        if (budgetValue === null || budgetValue === undefined) {
            window.alert("Please set the monthly budget value!");
            return;
        }
        const budget = parseFloat(budgetValue) || 0;
        const incomeTotal = transactions
            .filter((trx) => trx.type === "income")
            .reduce((total, trx) => total + trx.amount, 0);
        const expenseTotal = transactions
            .filter((trx) => trx.type === "expense")
            .reduce((total, trx) => total + trx.amount, 0);
        const balanceTotal = incomeTotal - expenseTotal;
        const budgetRemaining = budget - expenseTotal;

        balance.textContent = formatter.format(balanceTotal).substring(1);
        income.textContent = formatter.format(incomeTotal);
        expense.textContent = formatter.format(expenseTotal * -1);
        budgetRemainingElement.textContent = formatter.format(budgetRemaining);
    }

    function renderTable() {
        list.innerHTML = "";
        status.textContent = "";
        if (transactions.length === 0) {
            status.textContent = "No transactions";
            return;
        }
        const table = document.createElement("table");
        table.classList.add("transaction-table");
        table.id = "myTable";

        const tableHeader = `
        <thead>
      <tr>
        <th>Description</th>
        <th>Amount</th>
        <th>Payment Method</th>
        <th>Recipient</th>
        <th>Date</th>
        <th>Action</th>
      </tr>
      </thead>
    `;
        table.innerHTML = tableHeader;

        transactions.forEach(({ id, name, amount, date, type, source, recipient }) => {

            const dateTimeString = new Date(date).toLocaleString();
            const sign = type === "income" ? 1 : -1;
            const row = document.createElement("tr");
            const nameCell = document.createElement("td");
            nameCell.textContent = name;
            const amountCell = document.createElement("td");
            amountCell.classList.add("amount", type);
            const formattedAmount = formatter.format(Math.abs(amount) * sign);
            amountCell.innerHTML = `<span>${formattedAmount}</span>`;
            const paymentMethodCell = document.createElement("td");
            paymentMethodCell.textContent = source;
            const recipientCell = document.createElement("td");
            recipientCell.textContent = recipient;
            const dateCell = document.createElement("td");
            dateCell.textContent = dateTimeString;
            const actionCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.classList.add("action");
            deleteButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
            deleteButton.onclick = function () {
                deleteTransaction(id);
            };
            actionCell.appendChild(deleteButton);

            row.appendChild(nameCell);
            row.appendChild(amountCell);
            row.appendChild(paymentMethodCell);
            row.appendChild(recipientCell);
            row.appendChild(dateCell);
            row.appendChild(actionCell);

            table.insertBefore(row, table.firstChild);
        });

        list.appendChild(table);
        updateTotal();
    }

    renderTable();

    function deleteTransaction(id) {
        const index = transactions.findIndex((trx) => trx.id === id);
        transactions.splice(index, 1);

        updateTotal();
        saveTransactions();
        renderTable();
    }

    function addTransaction(e) {
        e.preventDefault();

        const formData = new FormData(this);
        const datetimeString = formData.get("date").replace("T", " ");
        const date = new Date(datetimeString);
        transactions.push({
            id: transactions.length + 1,
            name: formData.get("name"),
            amount: parseFloat(formData.get("amount")),
            date: date,
            source: formData.get("source"),
            recipient: formData.get("recipient"),
            type: formData.get("type") === "on" ? "income" : "expense",
        });
        this.reset();
        updateTotal();
        saveTransactions();
        renderTable();
    }

    function saveTransactions() {
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }


    function filterTable(searchInput, myTable, noResultsMessage) {
        const query = searchInput.value.toLowerCase();
        const rows = myTable.querySelectorAll("tr:not(:first-child)");
        let hasMatches = false;
        myTable.querySelector("tr:first-child").style.display = "";
        for (const row of rows) {
            let matchFound = false;
            const dataCells = row.querySelectorAll("td");
            for (const cell of dataCells) {
                const cellText = cell.textContent.toLowerCase();
                if (cellText.includes(query) || String(cellText).includes(query)) {
                    matchFound = true;
                    break;
                }
            }
            if (matchFound) {
                row.style.display = "";
                hasMatches = true;
            } else {
                row.style.display = "none";
            }
        }
        if (!hasMatches) {
            noResultsMessage.textContent = "NO MATCHING TRANSACTIONS FOUND";
            noResultsMessage.id = "status";
            myTable.after(noResultsMessage);
        } else {
            noResultsMessage.removeAttribute("id");
        }
    }

    const searchInput = document.getElementById("searchInput");
    const myTable = document.getElementById("myTable");
    const noResultsMessage = document.createElement("p");
    filterTable(searchInput, myTable, noResultsMessage);
    searchInput.addEventListener("input", () => {
        filterTable(searchInput, myTable, noResultsMessage);
    });

    function getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      
      const dateInput = document.getElementById("date");
      dateInput.value = getCurrentDateTime();
      dateInput.focus();
      const currentTime = new Date();
      const currentHours = currentTime.getHours();
      const currentMinutes = currentTime.getMinutes();
      const hoursString = String(currentHours).padStart(2, '0');
      const minutesString = String(currentMinutes).padStart(2, '0');
      dateInput.setSelectionRange(11, 16);
      setTimeout(() => {
        dateInput.setSelectionRange(14, 16);
      }, 0);

});