---
title: Mathematical Expressions in Scientific Writing
author: Dr. Hex
date: 2024-04-02
publish: true
audience: expert
tags: [math, latex, examples]
---

# Mathematical Expressions in Scientific Writing

This document demonstrates how to write mathematical expressions using LaTeX syntax in our CMS.

## Basic Inline Math

When discussing physics, we often need inline equations like $E = mc^2$[^1] or $F = ma$. These are rendered inline with the text.

## Block Equations

For more complex equations, we use block math:

$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
$$

This is the definition of a derivative, which has many applications in calculus[^2].

## Matrix Operations

Matrices can be represented using LaTeX:

$$
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}
\begin{bmatrix}
x \\
y
\end{bmatrix} =
\begin{bmatrix}
ax + by \\
cx + dy
\end{bmatrix}
$$

## Chemical Equations

Even chemical equations can be represented:

$$
\ce{CO2 + H2O <=> H2CO3}
$$

## Cross-References

For more examples, see [[features-example|Advanced Features]].

[^1]: Einstein's famous equation $E = mc^2$ relates energy (E) to mass (m) and the speed of light (c).
[^2]: Derivatives are fundamental to calculus and used extensively in physics, engineering, and economics to model rates of change. 