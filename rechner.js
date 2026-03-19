const resultArea = document.getElementById("resultArea");
const parenButton = document.getElementById("parenBtn");
let expression = "";
let nextParenIsOpen = true;
let openParens = 0;

let lastRepeatOperator = null;
let lastRepeatOperand = null;
let lastComputedValue = null;
let lastActionWasCalculate = false;

// Update the parenthesis button text based on the next expected parenthesis
function updateParenButton() {
    if (!parenButton) return;
    parenButton.textContent = nextParenIsOpen ? "(" : ")";
}

// Update the display with the current expression or "0" if empty
function updateDisplay() {
    resultArea.textContent = expression || "0";
    updateParenButton();
}

// Clear the entire expression and reset all states
function clearAll() {
    expression = "";
    nextParenIsOpen = true;
    openParens = 0;

    lastRepeatOperator = null;
    lastRepeatOperand = null;
    lastComputedValue = null;
    lastActionWasCalculate = false;

    updateDisplay();
}

// Remove the last character from the expression
function clearEntry() {
    if (!expression) return;

    const removed = expression.slice(-1);
    expression = expression.slice(0, -1);

    lastRepeatOperator = null;
    lastRepeatOperand = null;
    lastComputedValue = null;
    lastActionWasCalculate = false;

    if (removed === "(") {
        openParens = Math.max(0, openParens - 1);
        nextParenIsOpen = true;
    } else if (removed === ")") {
        openParens += 1;
        nextParenIsOpen = false;
    }

    updateDisplay();
}

// Append a value (number, operator, or parenthesis) to the expression with validation
function appendValue(value) {
    if (!value) return false;

    if (lastActionWasCalculate) {
        lastRepeatOperator = null;
        lastRepeatOperand = null;
        lastComputedValue = null;
        lastActionWasCalculate = false;
    }

    const operators = ["+", "-", "*", "/"];
    const lastChar = expression.slice(-1);

    if (value === "(") {
        if (/[0-9)]/.test(lastChar)) {
            expression += "*";
        }
        expression += "(";
        openParens += 1;
        updateDisplay();
        return true;
    }

    if (value === ")") {
        if (openParens <= 0) return false;
        if (!expression) return false;
        if (operators.includes(lastChar)) return false;

        if (lastChar === "(") {
            expression += "0)";
        } else {
            expression += ")";
        }
        openParens -= 1;
        updateDisplay();
        return true;
    }

    if (operators.includes(value)) {
        if (!expression) return false;
        if (lastChar === "(") {
            if (value !== "-") return false;
        }
        if (operators.includes(lastChar)) {
            expression = expression.slice(0, -1) + value;
            updateDisplay();
            return true;
        }
    }

    if (value === ".") {
        if (lastChar === ")") return false;

        const lastOperatorIndex = Math.max(
            expression.lastIndexOf("+"),
            expression.lastIndexOf("-"),
            expression.lastIndexOf("*"),
            expression.lastIndexOf("/")
        );
        const currentNumber = expression.slice(lastOperatorIndex + 1);
        if (currentNumber.includes(".")) return false;
        if (currentNumber === "") {
            expression += "0";
        }
    }

    expression += value;
    updateDisplay();
    return true;
}

// Toggle between adding an opening or closing parenthesis based on the current state
function toggleParenthesis() {
    if (nextParenIsOpen) {
        appendValue("(");
    } else {
        const closed = appendValue(")");
        if (!closed) {
            appendValue("(");
            nextParenIsOpen = false;
            return;
        }
    }

    nextParenIsOpen = !nextParenIsOpen;
}

// Sanitize the expression by removing trailing operators and balancing parentheses before evaluation
function sanitizeExpression(expr) {
    while (expr && /[+\-*/.(]$/.test(expr)) {
        expr = expr.slice(0, -1);
    }

    let depth = 0;
    for (const ch of expr) {
        if (ch === "(") depth += 1;
        else if (ch === ")") depth = Math.max(0, depth - 1);
    }
    if (depth > 0) {
        expr += ")".repeat(depth);
    }

    return expr;
}

// Evaluate the expression safely and handle repeat calculations with the last operator and operand
function calculate() {
    if (!expression) return;

    if (
        lastActionWasCalculate &&
        lastComputedValue !== null &&
        expression === lastComputedValue &&
        lastRepeatOperator &&
        lastRepeatOperand
    ) {
        expression += lastRepeatOperator + lastRepeatOperand;
    }

    expression = sanitizeExpression(expression);
    if (!expression) return;

    if (/[^0-9.+\-*/() ]/.test(expression)) {
        resultArea.textContent = "Error";
        return;
    }

    try {
        let result = Function(`"use strict"; return (${expression})`)();

        if (typeof result !== "number" || !isFinite(result)) {
            throw new Error("Invalid result");
        }

        if (!Number.isInteger(result)) {
            result = +result.toFixed(10);
        }

        const repeatInfo = extractRepeatInfo(expression);
        if (repeatInfo) {
            lastRepeatOperator = repeatInfo.operator;
            lastRepeatOperand = repeatInfo.operand;
        } else {
            lastRepeatOperator = null;
            lastRepeatOperand = null;
        }

        expression = String(result);
        lastComputedValue = expression;
        lastActionWasCalculate = true;
        openParens = 0;
        nextParenIsOpen = true;
        updateDisplay();
    } catch (err) {
        resultArea.textContent = "Error";
        expression = "";
        lastRepeatOperator = null;
        lastRepeatOperand = null;
        lastComputedValue = null;
        lastActionWasCalculate = false;
        openParens = 0;
        nextParenIsOpen = true;
    }
}

// Extract the last operator and operand from the expression for repeat calculations
function extractRepeatInfo(expr) {
    let depth = 0;
    for (let i = expr.length - 1; i >= 0; --i) {
        const ch = expr[i];
        if (ch === ")") {
            depth += 1;
            continue;
        }
        if (ch === "(") {
            depth -= 1;
            continue;
        }

        if (depth !== 0) continue;
        if (["+", "-", "*", "/"].includes(ch)) {
            const operand = expr.slice(i + 1);
            if (operand.length === 0) return null;
            return { operator: ch, operand };
        }
    }

    return null;
}

updateDisplay();