addCourse({ id: 'analyse', title: 'Analyse I', sub: 'A. Knowles — fondements rigoureux de l\'analyse réelle', color: '#0ea5a4', icon: '∫' }, String.raw`
@chapter bases | 1. Notions de base
@intro Le langage des mathématiques : logique, quantificateurs, ensembles et fonctions. Tout le reste du cours s'écrit avec ces outils.

@section Logique
- Une **assertion** est vraie ou fausse. Connecteurs : $\neg A$ (non), $A\wedge B$ (et), $A\vee B$ (ou inclusif), $A\Rightarrow B$, $A\Leftrightarrow B$.
- $A\Rightarrow B$ est faux **uniquement** si $A$ est vrai et $B$ faux. Elle équivaut à $\neg A\vee B$.
- **Contraposée** : $(A\Rightarrow B)\iff(\neg B\Rightarrow\neg A)$. À ne pas confondre avec la réciproque $B\Rightarrow A$.
- Négations : $\neg(A\wedge B) = \neg A\vee\neg B$, $\neg(A\vee B) = \neg A\wedge\neg B$, $\neg(A\Rightarrow B) = A\wedge\neg B$.
- Méthodes de preuve : directe, par **contraposée**, par l'**absurde**, par **récurrence**.

@section Quantificateurs
- $\forall x\in X,\ A(x)$ : « pour tout ». $\exists x\in X,\ A(x)$ : « il existe au moins un ».
- **Négation** : on échange $\forall\leftrightarrow\exists$ et on nie l'assertion : $\neg(\forall x, A(x)) = \exists x, \neg A(x)$.
! L'ordre compte : $\forall x\,\exists y$ (le $y$ peut dépendre de $x$) n'est pas la même chose que $\exists y\,\forall x$ (un seul $y$ pour tous les $x$).
ex: Négation de $\forall\epsilon>0\ \exists N\ \forall n\ge N:\ |u_n - \ell|<\epsilon$ : $\exists\epsilon>0\ \forall N\ \exists n\ge N:\ |u_n-\ell|\ge\epsilon$.

@section Ensembles
- $A\subset B$, $A\cup B$, $A\cap B$, $A\setminus B$, complémentaire $A^c$, ensemble des parties $\mathcal P(X)$, produit cartésien $X\times Y$ (couples $(x,y)$).
> **Lois de De Morgan** : $\big(\bigcup_i X_i\big)^c = \bigcap_i X_i^c$ et $\big(\bigcap_i X_i\big)^c = \bigcup_i X_i^c$.

@section Fonctions
- Une fonction $f:X\to Y$ : un domaine de départ $X$, un domaine d'arrivée $Y$, et pour chaque $x\in X$ **exactement un** $f(x)\in Y$.
- Image directe $f(A) = \{f(x): x\in A\}$ ; image réciproque $f^{-1}(B) = \{x: f(x)\in B\}$ (existe toujours, même si $f$ n'est pas bijective).
- **Injective** : $f(x) = f(x')\Rightarrow x = x'$. **Surjective** : $f(X) = Y$. **Bijective** : les deux.
- Composition $g\circ f$, **associative** : $h\circ(g\circ f) = (h\circ g)\circ f$.
- Si $f$ bijective : $g = f^{-1}$ si et seulement si $g\circ f = \mathrm{id}_X$ et $f\circ g = \mathrm{id}_Y$.
{{viz:fonctions}}

@formulas
Implication :: (A\Rightarrow B)\iff(\neg A\vee B)\iff(\neg B\Rightarrow\neg A)
Négation d'un « pour tout » :: \neg(\forall x\in X,\ A(x))\iff \exists x\in X,\ \neg A(x)
Négation d'un « il existe » :: \neg(\exists x\in X,\ A(x))\iff \forall x\in X,\ \neg A(x)
De Morgan :: (A\cup B)^c = A^c\cap B^c,\qquad (A\cap B)^c = A^c\cup B^c
Image réciproque :: f^{-1}(B) = \{x\in X : f(x)\in B\}

@pitfalls
- Confondre contraposée (équivalente) et réciproque (pas équivalente).
- Échanger l'ordre de $\forall$ et $\exists$ change le sens de la phrase.
- $f^{-1}(B)$ (image réciproque d'un ensemble) a un sens même si $f$ n'a pas de fonction inverse.

@cards
Contraposée de $A\Rightarrow B$ ? :: $\neg B\Rightarrow\neg A$ (équivalente à l'implication de départ).
Négation de $A\Rightarrow B$ ? :: $A\wedge\neg B$
Négation de $\forall x,\ A(x)$ ? :: $\exists x,\ \neg A(x)$
Lois de De Morgan ? :: $(A\cup B)^c = A^c\cap B^c$ et $(A\cap B)^c = A^c\cup B^c$
Définition de l'image réciproque $f^{-1}(B)$ ? :: $\{x\in X: f(x)\in B\}$
Quand $A\Rightarrow B$ est-elle fausse ? :: Seulement quand $A$ est vraie et $B$ est fausse.
Définition de l'injectivité (version analyse) ? :: $f(x) = f(x') \Rightarrow x = x'$

@quiz
? La contraposée de « s'il pleut, alors le sol est mouillé » est
+ si le sol n'est pas mouillé, alors il ne pleut pas
- si le sol est mouillé, alors il pleut
- s'il ne pleut pas, alors le sol n'est pas mouillé
- il pleut et le sol n'est pas mouillé
= Contraposée : $\neg B\Rightarrow\neg A$. La 2e réponse est la réciproque, la 4e est la négation.
? La négation de $\forall x\in X,\ \exists y\in Y,\ A(x,y)$ est
+ $\exists x\in X,\ \forall y\in Y,\ \neg A(x,y)$
- $\forall x\in X,\ \exists y\in Y,\ \neg A(x,y)$
- $\exists x\in X,\ \exists y\in Y,\ \neg A(x,y)$
- $\forall x\in X,\ \forall y\in Y,\ \neg A(x,y)$
= On échange chaque quantificateur et on nie l'assertion finale.
? L'implication $A\Rightarrow B$ est fausse lorsque
+ $A$ est vraie et $B$ est fausse
- $A$ est fausse et $B$ est vraie
- $A$ et $B$ sont fausses
- $A$ et $B$ sont vraies
= « Faux implique n'importe quoi » est toujours vrai.
? $(A\cap B)^c$ est égal à
+ $A^c\cup B^c$
- $A^c\cap B^c$
- $A\cup B$
- $A^c\setminus B^c$
= Loi de De Morgan : le complémentaire échange union et intersection.
? Laquelle de ces phrases dit « $f:\mathbb R\to\mathbb R$ est bornée » ?
+ $\exists M\ \forall x:\ |f(x)|\le M$
- $\forall x\ \exists M:\ |f(x)|\le M$
- $\forall M\ \exists x:\ |f(x)|\le M$
- $\exists x\ \forall M:\ |f(x)|\le M$
= Il faut UN seul $M$ valable pour tous les $x$. La 2e phrase est vraie pour toute fonction (prendre $M = |f(x)|$).
? Pour $f(x) = x^2$ sur $\mathbb R$, $f^{-1}([0,4])$ vaut
+ $[-2, 2]$
- $[0, 2]$
- $[0, 16]$
- n'existe pas car $f$ n'est pas bijective
= L'image réciproque est l'ensemble de tous les $x$ avec $x^2\in[0,4]$.

@chapter reels | 2. Les nombres réels
@intro On construit $\mathbb R$ à partir d'axiomes : arithmétique, ordre, et surtout l'axiome de complétude, qui distingue $\mathbb R$ de $\mathbb Q$ et rend possible toute l'analyse.

@section Les axiomes
- **(A)** addition : associative, commutative, neutre 0, opposé $-x$.
- **(M)** multiplication : associative, commutative, neutre $1\ne0$, inverse $x^{-1}$ pour $x\neq0$.
- **(D)** distributivité : $x(y+z) = xy + xz$. → $(\mathbb R,+,\cdot)$ est un **corps**.
- **Axiomes d'ordre** : $\le$ est un ordre total, compatible avec l'addition ($x\le y\Rightarrow x+z\le y+z$) et la multiplication par un positif.
- **(C) complétude** : toute partie non vide et majorée de $\mathbb R$ possède un **supremum**.
- $\mathbb Q$ vérifie tout sauf (C).

@section Valeur absolue
- $|x| = x$ si $x\ge0$, $-x$ sinon. $|xy| = |x||y|$.
> **Inégalité triangulaire** : $|x+y|\le|x|+|y|$, et sa version inversée $\big||x|-|y|\big|\le|x-y|$.
- $|x-a|<\epsilon\iff a-\epsilon<x<a+\epsilon$ : $x$ est à distance $<\epsilon$ de $a$.

@section Supremum et infimum
- $M$ est un **majorant** de $A$ si $\forall a\in A,\ a\le M$.
- $\sup A$ = le **plus petit majorant**. $\inf A$ = le plus grand minorant.
- Le $\sup$ n'appartient pas forcément à $A$. S'il y appartient, c'est le **maximum**.
> **Caractérisation** : $s = \sup A$ ssi $s$ majore $A$ et $\forall\epsilon>0,\ \exists a\in A,\ a>s-\epsilon$.
ex: $A = [0,1)$ : $\sup A = 1$ mais $A$ n'a pas de maximum. $A = \{1/n : n\ge1\}$ : $\inf A = 0$, non atteint.

@section Conséquences de la complétude
- **Principe d'Archimède** : $\forall x\in\mathbb R,\ \exists n\in\mathbb N,\ x\le n$. Corollaire : $\forall\epsilon>0,\ \exists n,\ 0<1/n<\epsilon$.
- **Racine carrée** : pour tout $u>0$ il existe un unique $v>0$ avec $v^2 = u$.
- $\sqrt2\notin\mathbb Q$ : les irrationnels existent. $\mathbb Q$ est **dense** dans $\mathbb R$.

@section Cardinal *
- $X$ et $Y$ sont **équipotents** s'il existe une bijection entre eux. **Dénombrable** = équipotent à $\mathbb N$.
- $\mathbb Z$ et $\mathbb Q$ sont dénombrables.
- **Cantor** : il n'existe pas de surjection $X\to\mathcal P(X)$. Conséquence : $\mathbb R$ **n'est pas dénombrable**.

@formulas
Inégalité triangulaire :: |x+y|\le |x|+|y|
Triangulaire inversée :: \big||x|-|y|\big|\le |x-y|
Caractérisation du sup :: s=\sup A\iff \begin{cases}\forall a\in A,\ a\le s\\ \forall\epsilon>0\ \exists a\in A,\ a>s-\epsilon\end{cases}
Principe d'Archimède :: \forall x\in\mathbb R\ \exists n\in\mathbb N:\ x\le n
Voisinage :: |x-a|<\epsilon\iff x\in(a-\epsilon,\,a+\epsilon)

@pitfalls
- sup ≠ max : le supremum existe toujours pour une partie majorée non vide, le maximum pas forcément.
- L'axiome (C) est faux dans $\mathbb Q$ : $\{r\in\mathbb Q: r^2<2\}$ est majoré mais n'a pas de sup rationnel.
- Multiplier une inégalité par un nombre négatif **inverse** son sens.

@cards
Énoncé de l'axiome de complétude (C) ? :: Toute partie non vide et majorée de $\mathbb R$ admet un supremum.
Définition de $\sup A$ ? :: Le plus petit des majorants de $A$.
Caractérisation de $s = \sup A$ avec $\epsilon$ ? :: $s$ majore $A$ et $\forall\epsilon>0\ \exists a\in A:\ a > s-\epsilon$.
Inégalité triangulaire ? :: $|x+y|\le|x|+|y|$
Principe d'Archimède ? :: Pour tout réel $x$ il existe un entier $n$ avec $x\le n$.
$\mathbb R$ est-il dénombrable ? Et $\mathbb Q$ ? :: $\mathbb Q$ est dénombrable, $\mathbb R$ ne l'est pas.
Différence entre sup et max ? :: Le max est un sup qui appartient à l'ensemble.

@quiz
? Quel axiome distingue $\mathbb R$ de $\mathbb Q$ ?
+ L'axiome de complétude (C)
- La distributivité (D)
- L'existence d'un inverse (M)
- L'ordre total
= $\mathbb Q$ est aussi un corps ordonné, mais certaines parties majorées n'y ont pas de supremum.
? Pour $A = \{1 - 1/n : n\in\mathbb N,\ n\ge1\}$ :
+ $\sup A = 1$, et $A$ n'a pas de maximum
- $\max A = 1$
- $\sup A$ n'existe pas
- $\sup A = 0$
= Les éléments s'approchent de 1 sans jamais l'atteindre.
? Laquelle de ces inégalités est toujours vraie ?
+ $|x+y|\le|x|+|y|$
- $|x+y|\ge|x|+|y|$
- $|x-y|\le|x|-|y|$
- $|x+y| = |x|+|y|$
= C'est l'inégalité triangulaire.
? $s = \sup A$ signifie que $s$ majore $A$ et que
+ $\forall\epsilon>0\ \exists a\in A:\ a>s-\epsilon$
- $s\in A$
- $\exists\epsilon>0\ \forall a\in A:\ a<s-\epsilon$
- $\forall a\in A:\ a<s$
= Aucun nombre plus petit que $s$ n'est un majorant.
? L'ensemble $\mathbb Q$ des rationnels est
+ dénombrable
- non dénombrable
- fini
- équipotent à $\mathbb R$
= On peut numéroter les fractions ; en revanche $\mathbb R$ n'est pas dénombrable.
? Conséquence du principe d'Archimède :
+ $\forall\epsilon>0\ \exists n\in\mathbb N:\ 1/n<\epsilon$
- $\mathbb N$ est majoré dans $\mathbb R$
- $\exists\epsilon>0\ \forall n:\ 1/n>\epsilon$
- toute suite est bornée
= C'est ce qui garantit que $1/n\to0$.

@chapter suites | 3. Suites numériques
@intro La notion de limite d'une suite, définie rigoureusement avec ε et N, puis les grands théorèmes : convergence monotone, Bolzano–Weierstrass, suites de Cauchy.

@section Convergence
> $(u_n)$ **converge vers** $\ell$ si : $\forall\epsilon>0,\ \exists N\in\mathbb N,\ \forall n\ge N:\ |u_n-\ell|<\epsilon$.
- En mots : à partir d'un certain rang $N$ (qui dépend de $\epsilon$), tous les termes sont dans la bande $(\ell-\epsilon,\ell+\epsilon)$.
- La limite, si elle existe, est **unique**. Toute suite convergente est **bornée** (réciproque fausse : $(-1)^n$).
{{viz:suite}}
- **Opérations** : si $u_n\to u$, $v_n\to v$ alors $u_n+v_n\to u+v$, $u_nv_n\to uv$, $u_n/v_n\to u/v$ (si $v\ne0$).
- **Théorème des gendarmes** : si $u_n\le v_n\le w_n$ et $u_n,w_n\to\ell$ alors $v_n\to\ell$.
- $u_n\to+\infty$ : $\forall M,\ \exists N,\ \forall n\ge N:\ u_n\ge M$.

@section Convergence monotone
> Toute suite **croissante et majorée** converge, vers $\sup\{u_n\}$. (Idem décroissante et minorée, vers l'inf.)
- C'est une conséquence directe de l'axiome de complétude.
- Très utile pour montrer qu'une suite converge **sans connaître sa limite**.

@section Sous-suites et valeurs d'adhérence
- **Sous-suite** : $(u_{\varphi(n)})$ avec $\varphi:\mathbb N\to\mathbb N$ strictement croissante.
- Toute sous-suite d'une suite convergente converge vers la même limite. → Deux sous-suites de limites différentes prouvent la **divergence**.
- **Valeur d'adhérence** : limite d'une sous-suite. Ex. : $(-1)^n$ a pour valeurs d'adhérence $-1$ et $1$.
- $\limsup u_n$ = plus grande valeur d'adhérence, $\liminf u_n$ = plus petite. La suite converge ssi $\limsup = \liminf$.
> **Bolzano–Weierstrass** : toute suite **bornée** possède une sous-suite convergente.

@section Suites de Cauchy
- $(u_n)$ est **de Cauchy** si $\forall\epsilon>0,\ \exists N,\ \forall m,n\ge N:\ |u_m-u_n|<\epsilon$ : les termes se rapprochent **entre eux**.
> Dans $\mathbb R$ : **convergente ⟺ de Cauchy** ($\mathbb R$ est complet).
- Avantage : le critère de Cauchy ne fait pas intervenir la limite.

@formulas
Convergence :: \forall\epsilon>0\ \exists N\ \forall n\ge N:\ |u_n-\ell|<\epsilon
Divergence vers l'infini :: \forall M\ \exists N\ \forall n\ge N:\ u_n\ge M
Gendarmes :: u_n\le v_n\le w_n,\ u_n\to\ell,\ w_n\to\ell\ \Rightarrow\ v_n\to\ell
Suite de Cauchy :: \forall\epsilon>0\ \exists N\ \forall m,n\ge N:\ |u_m-u_n|<\epsilon
Limite supérieure :: \limsup_{n\to\infty} u_n = \lim_{n\to\infty}\ \sup_{k\ge n} u_k

@pitfalls
- Bornée ⇏ convergente : $(-1)^n$ est bornée et diverge.
- $u_{n+1}-u_n\to0$ ne suffit PAS pour être de Cauchy (ex. $u_n = \sqrt n$ ou la série harmonique).
- Le $N$ dépend de $\epsilon$ : plus $\epsilon$ est petit, plus $N$ est grand en général.

@cards
Définition de $u_n\to\ell$ ? :: $\forall\epsilon>0\ \exists N\ \forall n\ge N:\ |u_n-\ell|<\epsilon$
Théorème de convergence monotone ? :: Toute suite croissante et majorée converge (vers son supremum).
Théorème de Bolzano–Weierstrass ? :: Toute suite bornée possède une sous-suite convergente.
Définition d'une suite de Cauchy ? :: $\forall\epsilon>0\ \exists N\ \forall m,n\ge N:\ |u_m-u_n|<\epsilon$
Lien Cauchy / convergence dans $\mathbb R$ ? :: Équivalence : une suite réelle converge si et seulement si elle est de Cauchy.
Qu'est-ce qu'une valeur d'adhérence ? :: La limite d'une sous-suite extraite.
Théorème des gendarmes ? :: Si $u_n\le v_n\le w_n$ et $u_n, w_n\to\ell$, alors $v_n\to\ell$.
Comment prouver qu'une suite diverge avec des sous-suites ? :: En exhibant deux sous-suites qui convergent vers des limites différentes.

@quiz
? La définition de « $(u_n)$ converge vers $\ell$ » est
+ $\forall\epsilon>0\ \exists N\ \forall n\ge N:\ |u_n-\ell|<\epsilon$
- $\exists N\ \forall\epsilon>0\ \forall n\ge N:\ |u_n-\ell|<\epsilon$
- $\forall\epsilon>0\ \forall N\ \exists n\ge N:\ |u_n-\ell|<\epsilon$
- $\exists\epsilon>0\ \exists N\ \forall n\ge N:\ |u_n-\ell|<\epsilon$
= $N$ dépend de $\epsilon$, donc $\exists N$ vient après $\forall\epsilon$. La 2e version forcerait la suite à être constante à partir de $N$.
? La suite $u_n = (-1)^n$
+ est bornée mais diverge
- converge vers 0
- est de Cauchy
- tend vers $+\infty$
= Elle a deux valeurs d'adhérence ($-1$ et $1$), donc elle ne converge pas.
? Une suite croissante et majorée
+ converge
- peut diverger
- tend vers $+\infty$
- est constante à partir d'un certain rang
= Théorème de convergence monotone ; la limite est le supremum des termes.
? Bolzano–Weierstrass affirme que toute suite bornée
+ possède une sous-suite convergente
- converge
- est monotone
- est de Cauchy
= La suite elle-même peut diverger, mais on peut toujours en extraire une sous-suite convergente.
? Que vaut $\lim_{n\to\infty}\dfrac{\sin n}{n}$ ?
+ $0$
- $1$
- n'existe pas
- $+\infty$
= Gendarmes : $-1/n\le\sin(n)/n\le1/n$.
? Dans $\mathbb R$, une suite de Cauchy
+ converge toujours
- est seulement bornée
- peut diverger
- est forcément monotone
= $\mathbb R$ est complet. (Dans $\mathbb Q$ ce serait faux.)
? $\limsup$ et $\liminf$ de $u_n = (-1)^n(1+1/n)$ valent
+ $1$ et $-1$
- $2$ et $-2$
- $0$ et $0$
- $+\infty$ et $-\infty$
= Les termes pairs tendent vers 1, les impairs vers $-1$.

@chapter continues | 4. Fonctions continues
@intro Limite d'une fonction, continuité en ε–δ, et les grands théorèmes sur les fonctions continues sur un intervalle fermé borné : maximum atteint, valeurs intermédiaires, continuité uniforme.

@section Limite et continuité
- $\lim_{x\to a} f(x) = \ell$ : $\forall\epsilon>0,\ \exists\delta>0,\ \forall x\in A:\ |x-a|<\delta\Rightarrow|f(x)-\ell|<\epsilon$.
> $f$ est **continue en $a$** si $\forall\epsilon>0,\ \exists\delta>0:\ |x-a|<\delta\Rightarrow|f(x)-f(a)|<\epsilon$.
- **Caractérisation séquentielle** : $f$ continue en $a$ ⟺ pour toute suite $x_n\to a$ on a $f(x_n)\to f(a)$.
- Sommes, produits, quotients (dénominateur non nul) et **composées** de fonctions continues sont continus.
{{viz:epsdelta}}

@section Théorèmes sur [a,b]
> **Maximum** : une fonction continue sur $[a,b]$ est bornée et **atteint** son maximum et son minimum.
> **Valeurs intermédiaires (TVI)** : si $f$ est continue sur $[a,b]$, toute valeur entre $f(a)$ et $f(b)$ est atteinte. En particulier si $f(a)$ et $f(b)$ sont de signes opposés, $f$ s'annule.
- Conséquence : l'image d'un intervalle fermé borné par une fonction continue est un intervalle fermé borné.
- Les hypothèses comptent : sur $(0,1]$, $1/x$ est continue mais non bornée.
{{viz:dichotomie}}

@section Fonction inverse
- $f$ continue et **strictement monotone** sur un intervalle $I$ ⟹ $f:I\to f(I)$ est bijective et $f^{-1}$ est **continue** (et strictement monotone de même sens).
- Un **homéomorphisme** est une bijection continue dont l'inverse est continue.

@section Continuité uniforme
- $f$ est **uniformément continue** si $\forall\epsilon>0,\ \exists\delta>0,\ \forall x,y:\ |x-y|<\delta\Rightarrow|f(x)-f(y)|<\epsilon$.
- Différence : le $\delta$ est **le même pour tous les points** (il ne dépend que de $\epsilon$).
> **Heine** : toute fonction continue sur $[a,b]$ est uniformément continue.
ex: $x^2$ sur $\mathbb R$ est continue mais pas uniformément continue ; $1/x$ sur $(0,1]$ non plus.

@section Notation de Landau
- $f = o(g)$ en $a$ (**petit o**) : $f(x)/g(x)\to0$ — $f$ est négligeable devant $g$.
- $f = O(g)$ en $a$ (**grand O**) : $|f(x)|\le C|g(x)|$ près de $a$ — $f$ est au plus du même ordre que $g$.
ex: En 0 : $x^2 = o(x)$ ; $\sin x = x + o(x)$ ; $\sin x = O(x)$.

@formulas
Continuité en a :: \forall\epsilon>0\ \exists\delta>0\ \forall x:\ |x-a|<\delta\Rightarrow|f(x)-f(a)|<\epsilon
Continuité uniforme :: \forall\epsilon>0\ \exists\delta>0\ \forall x,y:\ |x-y|<\delta\Rightarrow|f(x)-f(y)|<\epsilon
Caractérisation séquentielle :: x_n\to a\ \Rightarrow\ f(x_n)\to f(a)
TVI :: f\in C([a,b]),\ f(a)<y<f(b)\ \Rightarrow\ \exists x\in(a,b):\ f(x)=y
Petit o :: f=o(g)\ (x\to a)\iff \lim_{x\to a}\frac{f(x)}{g(x)}=0

@pitfalls
- Continuité : $\delta$ peut dépendre de $\epsilon$ ET du point $a$. Continuité uniforme : $\delta$ ne dépend que de $\epsilon$.
- Le théorème du maximum est faux sur un intervalle ouvert ou non borné.
- Le TVI donne l'existence d'une solution, pas son unicité (il faut la stricte monotonie en plus).

@cards
Définition ε–δ de la continuité en $a$ ? :: $\forall\epsilon>0\ \exists\delta>0:\ |x-a|<\delta\Rightarrow|f(x)-f(a)|<\epsilon$
Énoncé du TVI ? :: Si $f$ est continue sur $[a,b]$, toute valeur comprise entre $f(a)$ et $f(b)$ est atteinte.
Théorème du maximum ? :: Une fonction continue sur $[a,b]$ atteint son max et son min.
Différence continuité / continuité uniforme ? :: En continuité uniforme, le même $\delta$ convient pour tous les points.
Théorème de Heine ? :: Toute fonction continue sur $[a,b]$ est uniformément continue.
Que signifie $f = o(g)$ en $a$ ? :: $f(x)/g(x)\to0$ quand $x\to a$.
Caractérisation séquentielle de la continuité ? :: $f$ continue en $a$ ssi $f(x_n)\to f(a)$ pour toute suite $x_n\to a$.
Condition pour que $f^{-1}$ existe et soit continue ? :: $f$ continue et strictement monotone sur un intervalle.

@quiz
? $f$ continue sur $[a,b]$ avec $f(a)<0<f(b)$. Alors
+ il existe $x\in(a,b)$ tel que $f(x)=0$
- $f$ est croissante
- $f$ s'annule exactement une fois
- $f$ est dérivable
= C'est le théorème des valeurs intermédiaires. Il ne dit rien sur l'unicité.
? Laquelle de ces fonctions n'est PAS uniformément continue sur son domaine ?
+ $x^2$ sur $\mathbb R$
- $x^2$ sur $[0,1]$
- $\sin x$ sur $\mathbb R$
- $x$ sur $\mathbb R$
= Sur $\mathbb R$, la pente de $x^2$ devient arbitrairement grande : aucun $\delta$ ne convient partout.
? Une fonction continue sur $[a,b]$
+ atteint son maximum
- peut être non bornée
- est forcément monotone
- est forcément dérivable
= Théorème du maximum (qui utilise Bolzano–Weierstrass).
? En $x\to0$, laquelle est vraie ?
+ $x^2 = o(x)$
- $x = o(x^2)$
- $\sqrt{x} = o(x)$
- $1 = o(x)$
= $x^2/x = x\to0$ : $x^2$ est négligeable devant $x$ près de 0.
? Pour la continuité uniforme, le $\delta$
+ dépend seulement de $\epsilon$
- dépend de $\epsilon$ et du point considéré
- ne dépend de rien
- dépend seulement du point considéré
= C'est exactement ce qui la distingue de la continuité simple.
? La fonction $f(x) = 1/x$ sur $(0,1]$ est
+ continue mais non bornée
- continue et bornée
- discontinue
- uniformément continue
= L'intervalle n'est pas fermé en 0 : le théorème du maximum ne s'applique pas.

@chapter derivee | 5. La dérivée
@intro La dérivée vue rigoureusement : définition, théorèmes de Rolle et des accroissements finis, Taylor–Lagrange et étude des extremums.

@section Dérivée en un point
- $f$ est **dérivable en $a$** si $f'(a) = \lim_{x\to a}\dfrac{f(x)-f(a)}{x-a}$ existe.
- Équivalent : $f(x) = f(a) + f'(a)(x-a) + o(x-a)$ — la meilleure approximation affine.
> **Dérivable ⟹ continue.** La réciproque est fausse : $|x|$ est continue mais non dérivable en 0.
- Règles : somme, produit, quotient, composition $(g\circ f)' = g'(f)\,f'$, inverse $(f^{-1})'(y) = \dfrac{1}{f'(f^{-1}(y))}$.
{{viz:tangente}}

@section Extremums et accroissements finis
- Si $f$ est dérivable en un **extremum local intérieur** $a$, alors $f'(a) = 0$.
> **Rolle** : $f$ continue sur $[a,b]$, dérivable sur $(a,b)$, $f(a) = f(b)$ ⟹ $\exists c\in(a,b)$ avec $f'(c) = 0$.
> **Accroissements finis (TAF)** : $\exists c\in(a,b)$ avec $f(b)-f(a) = f'(c)(b-a)$ : quelque part, la tangente est parallèle à la corde.
- Conséquences : $f'\ge0$ ⟺ $f$ croissante ; $f' = 0$ ⟺ $f$ constante ; $f'>0$ ⟹ strictement croissante.
- **Inégalité des accroissements finis** : $|f'|\le M$ ⟹ $|f(b)-f(a)|\le M|b-a|$.

@section Ordres supérieurs et Taylor
- $C^n(I)$ : fonctions $n$ fois dérivables avec $f^{(n)}$ continue.
> **Taylor–Lagrange** : pour $f\in C^{n+1}$, $f(b) = \displaystyle\sum_{k=0}^n\frac{f^{(k)}(a)}{k!}(b-a)^k + \frac{f^{(n+1)}(c)}{(n+1)!}(b-a)^{n+1}$ pour un $c$ entre $a$ et $b$.
- Pour $n=0$ on retrouve le TAF.

@section Nature des points critiques
- Soit $f'(a) = \dots = f^{(n-1)}(a) = 0$ et $f^{(n)}(a)\neq0$.
- $n$ **pair** : extremum local — minimum si $f^{(n)}(a)>0$, maximum si $f^{(n)}(a)<0$.
- $n$ **impair** : pas d'extremum (point d'inflexion à tangente horizontale).
ex: $x^4$ en 0 : $n=4$, $f^{(4)}>0$ → minimum. $x^3$ en 0 : $n=3$ → pas d'extremum.

@formulas
Dérivée :: f'(a)=\lim_{x\to a}\frac{f(x)-f(a)}{x-a}
Approximation affine :: f(x)=f(a)+f'(a)(x-a)+o(x-a)
Accroissements finis :: \exists c\in(a,b):\ f(b)-f(a)=f'(c)\,(b-a)
Inégalité des accroissements finis :: |f(b)-f(a)|\le \sup|f'|\cdot|b-a|
Taylor–Lagrange :: f(b)=\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(b-a)^k+\frac{f^{(n+1)}(c)}{(n+1)!}(b-a)^{n+1}
Dérivée de l'inverse :: (f^{-1})'(y)=\frac{1}{f'(f^{-1}(y))}

@pitfalls
- $f'(a) = 0$ est nécessaire pour un extremum intérieur, pas suffisant ($x^3$).
- Un extremum peut être au **bord** de l'intervalle sans que $f'$ s'y annule.
- Rolle et le TAF exigent la continuité sur $[a,b]$ fermé et la dérivabilité sur $(a,b)$ ouvert.

@cards
Théorème de Rolle ? :: $f$ continue sur $[a,b]$, dérivable sur $(a,b)$, $f(a)=f(b)$ ⟹ $\exists c$ avec $f'(c)=0$.
Théorème des accroissements finis ? :: $\exists c\in(a,b)$ : $f(b)-f(a) = f'(c)(b-a)$.
Dérivable implique… ? :: Continue (la réciproque est fausse, ex. $|x|$).
Formule de Taylor–Lagrange (reste) ? :: $\dfrac{f^{(n+1)}(c)}{(n+1)!}(b-a)^{n+1}$ avec $c$ entre $a$ et $b$.
Première dérivée non nulle d'ordre pair positif en un point critique ? :: C'est un minimum local.
Première dérivée non nulle d'ordre impair ? :: Pas d'extremum.
Si $f' = 0$ sur un intervalle ? :: $f$ est constante (par le TAF).

@quiz
? Le théorème des accroissements finis affirme l'existence de $c\in(a,b)$ tel que
+ $f'(c) = \dfrac{f(b)-f(a)}{b-a}$
- $f'(c) = 0$
- $f(c) = \dfrac{f(a)+f(b)}{2}$
- $f'(c) = f(b)-f(a)$
= Il existe un point où la tangente est parallèle à la corde.
? La fonction $|x|$ en $0$ est
+ continue mais pas dérivable
- dérivable mais pas continue
- ni continue ni dérivable
- dérivable de dérivée 0
= Les dérivées à gauche ($-1$) et à droite ($+1$) sont différentes.
? Si $f'(a) = f''(a) = 0$ et $f'''(a)\ne0$, alors $a$ est
+ pas un extremum
- un minimum local
- un maximum local
- on ne peut pas conclure
= La première dérivée non nulle est d'ordre impair (3) : pas d'extremum.
? Quelle hypothèse du théorème de Rolle s'ajoute à celles du TAF ?
+ $f(a) = f(b)$
- $f'(a) = f'(b)$
- $f$ est de classe $C^2$
- $f$ est monotone
= Rolle est le cas particulier du TAF où la corde est horizontale.
? Si $f'(x) = 0$ pour tout $x$ d'un intervalle, alors
+ $f$ est constante
- $f$ est nulle
- $f$ est linéaire
- on ne peut rien dire
= Par le TAF, $f(b)-f(a) = f'(c)(b-a) = 0$ pour tous $a,b$.
? Si $|f'(x)|\le 3$ sur $[0,2]$, alors $|f(2)-f(0)|$ est au plus
+ $6$
- $3$
- $2$
- $9$
= Inégalité des accroissements finis : $3\times(2-0)$.

@chapter riemann | 6. L'intégrale de Riemann
@intro Construction rigoureuse de l'intégrale par les fonctions en escalier, théorème fondamental, et règles de calcul.

@section Construction
- Une **fonction en escalier** est constante par morceaux : son intégrale est $\sum_i c_i\cdot(\text{longueur de } I_i)$.
- Pour $f$ bornée : **intégrale inférieure** = sup des intégrales des escaliers $\le f$ ; **intégrale supérieure** = inf des intégrales des escaliers $\ge f$.
> $f$ est **intégrable (Riemann)** si intégrale inférieure = intégrale supérieure. Cette valeur commune est $\int_a^b f$.
- Toute fonction **monotone** est intégrable. Toute fonction **continue** est intégrable (via la continuité uniforme).
- Non intégrable : l'indicatrice de $\mathbb Q$ sur $[0,1]$ (inférieure 0, supérieure 1).
{{viz:riemann}}

@section Propriétés
- **Monotonie** : $f\le g\Rightarrow\int f\le\int g$.
- **Linéarité** : $\int(\alpha f+\beta g) = \alpha\int f+\beta\int g$.
- $\left|\int_a^b f\right|\le\int_a^b|f|\le(b-a)\,\|f\|_\infty$ où $\|f\|_\infty = \sup|f|$.
- **Chasles** : $\int_a^c f = \int_a^b f+\int_b^c f$. Convention $\int_b^a = -\int_a^b$.

@section Théorème fondamental
> Si $f$ est continue, $F(x) = \int_a^x f(t)\,dt$ est dérivable et $F' = f$. Et pour toute primitive $F$ : $\int_a^b f = F(b)-F(a)$.
- Deux primitives d'une même fonction sur un intervalle diffèrent d'une **constante**.

@section Règles de calcul
- **Par parties** : $\int_a^b f'g = [fg]_a^b-\int_a^b fg'$.
- **Changement de variable** : $\int_a^b f(\varphi(t))\,\varphi'(t)\,dt = \int_{\varphi(a)}^{\varphi(b)} f(x)\,dx$.

@section Intégrales impropres
- Sur $(a,b)$ ouvert (bornes éventuellement infinies) : on prend la limite des intégrales sur des intervalles fermés qui grandissent.
> **Référence** : $\int_1^\infty\dfrac{dx}{x^\alpha}$ converge ⟺ $\alpha>1$ ; $\int_0^1\dfrac{dx}{x^\alpha}$ converge ⟺ $\alpha<1$.

@formulas
Intégrabilité :: \sup_{\varphi\le f}\int\varphi\;=\;\inf_{\psi\ge f}\int\psi\quad(\varphi,\psi\text{ en escalier})
Théorème fondamental :: \frac{d}{dx}\int_a^x f(t)\,dt=f(x),\qquad \int_a^b f=F(b)-F(a)
Majoration :: \left|\int_a^b f\right|\le\int_a^b|f|\le(b-a)\|f\|_\infty
Par parties :: \int_a^b f'g=[fg]_a^b-\int_a^b fg'
Changement de variable :: \int_a^b f(\varphi(t))\varphi'(t)\,dt=\int_{\varphi(a)}^{\varphi(b)}f(x)\,dx
Intégrales de Riemann :: \int_1^\infty\frac{dx}{x^\alpha}<\infty\iff\alpha>1

@pitfalls
- Intégrable ne veut pas dire continue : toute fonction monotone est intégrable, même avec des sauts.
- $\int_1^\infty dx/x$ **diverge** (cas limite $\alpha = 1$).
- Le théorème fondamental demande $f$ continue pour avoir $F' = f$.

@cards
Quand une fonction bornée est-elle Riemann-intégrable ? :: Quand son intégrale inférieure (sup des escaliers en dessous) égale son intégrale supérieure (inf des escaliers au-dessus).
Deux classes de fonctions toujours intégrables sur $[a,b]$ ? :: Les fonctions monotones et les fonctions continues.
Théorème fondamental (partie dérivation) ? :: $\frac{d}{dx}\int_a^x f(t)dt = f(x)$ pour $f$ continue.
Pour quels $\alpha$ $\int_1^\infty x^{-\alpha}dx$ converge-t-elle ? :: Pour $\alpha>1$.
Pour quels $\alpha$ $\int_0^1 x^{-\alpha}dx$ converge-t-elle ? :: Pour $\alpha<1$.
Exemple de fonction non intégrable au sens de Riemann ? :: L'indicatrice de $\mathbb Q$ sur $[0,1]$.
Majoration de $|\int_a^b f|$ ? :: $\le\int_a^b|f|\le(b-a)\sup|f|$

@quiz
? Une fonction bornée $f$ est Riemann-intégrable si
+ ses intégrales inférieure et supérieure coïncident
- elle est positive
- elle est dérivable
- elle possède une primitive explicite
= C'est la définition, à partir des fonctions en escalier en dessous et au-dessus de $f$.
? Laquelle de ces fonctions n'est pas Riemann-intégrable sur $[0,1]$ ?
+ L'indicatrice des rationnels
- Une fonction croissante avec des sauts
- $\sqrt x$
- $\sin(1/x)$ prolongée par 0 en 0
= Tout escalier en dessous a une intégrale $\le0$, tout escalier au-dessus $\ge1$.
? Que vaut $\dfrac{d}{dx}\displaystyle\int_0^x\cos(t^2)\,dt$ ?
+ $\cos(x^2)$
- $-2x\sin(x^2)$
- $\sin(x^2)$
- $\cos(x^2)-1$
= Théorème fondamental : la dérivée de l'intégrale par rapport à sa borne supérieure est la fonction intégrée.
? $\displaystyle\int_1^\infty\frac{dx}{x^\alpha}$ converge si et seulement si
+ $\alpha>1$
- $\alpha\ge1$
- $\alpha<1$
- $\alpha>0$
= Pour $\alpha = 1$ on obtient $\ln R\to\infty$.
? $\displaystyle\int_0^1\frac{dx}{\sqrt x}$
+ converge et vaut $2$
- diverge
- converge et vaut $1/2$
- n'a pas de sens
= $[2\sqrt x]_0^1 = 2$ ; c'est le cas $\alpha = 1/2<1$.
? Deux primitives d'une même fonction continue sur un intervalle
+ diffèrent d'une constante
- sont égales
- peuvent différer d'une fonction quelconque
- diffèrent d'une fonction affine
= Leur différence a une dérivée nulle, donc est constante (TAF).

@chapter elementaires | 7. Fonctions élémentaires
@intro Les fonctions trigonométriques, le logarithme et l'exponentielle sont ici **définis** proprement à l'aide de l'intégrale, puis on démontre leurs propriétés.

@section Trigonométrie par les aires
- $\pi$ est défini comme l'aire du disque unité : $\pi := 2\displaystyle\int_{-1}^1\sqrt{1-x^2}\,dx$.
- On définit l'aire du **secteur** associé à $x\in[-1,1]$, puis $\cos\theta$ et $\sin\theta$ comme les coordonnées du point du cercle dont le secteur a une aire $\theta/2$.
- On étend à $\mathbb R$ par symétrie et **périodicité $2\pi$**.
- $\cos' = -\sin$, $\sin' = \cos$, $\cos^2+\sin^2 = 1$.
- $\tan = \dfrac{\sin}{\cos}$, $\cot = \dfrac{\cos}{\sin}$, $\csc = \dfrac1{\sin}$.
{{viz:trigo}}
- Inverses : $\arcsin'(x) = \dfrac1{\sqrt{1-x^2}}$, $\arccos'(x) = -\dfrac1{\sqrt{1-x^2}}$, $\arctan'(x) = \dfrac1{1+x^2}$.

@section Logarithme
> $\log x := \displaystyle\int_1^x\frac{dt}{t}$ pour $x>0$.
- Donc $\log 1 = 0$, $\log' x = 1/x>0$ : strictement croissante.
- $\log(xy) = \log x+\log y$ ; $\log(1/x) = -\log x$ ; $\log(x^n) = n\log x$.
- $\log:(0,\infty)\to\mathbb R$ est **bijective**.

@section Exponentielle
> $\exp := \log^{-1}:\mathbb R\to(0,\infty)$.
- $\exp' = \exp$, $\exp(0) = 1$, $\exp(x+y) = \exp(x)\exp(y)$.
- $e := \exp(1)$, et on note $e^x := \exp x$.
- **Puissance générale** : $a^x := e^{x\log a}$ pour $a>0$. Alors $a^{x+y} = a^xa^y$, $(a^x)^y = a^{xy}$.

@section Croissances comparées
- Pour tout $n$ : $\lim_{x\to\infty}\dfrac{x^n}{e^x} = 0$ — l'exponentielle bat toute puissance.
- $\lim_{x\to\infty}\dfrac{\log x}{x^a} = 0$ ($a>0$) — toute puissance bat le logarithme.
- $\lim_{x\to0^+}x^a\log x = 0$.
- $e = \lim_{n\to\infty}(1+1/n)^n$.

@formulas
Définition de π :: \pi := 2\int_{-1}^{1}\sqrt{1-x^2}\,dx
Logarithme :: \log x := \int_1^x\frac{dt}{t}
Propriété du log :: \log(xy)=\log x+\log y
Exponentielle :: \exp=\log^{-1},\quad \exp'=\exp,\quad \exp(x+y)=\exp(x)\exp(y)
Puissance :: a^x := e^{x\log a}\quad(a>0)
Arcsinus :: \arcsin'(x)=\frac{1}{\sqrt{1-x^2}}
Croissance comparée :: \lim_{x\to\infty}\frac{x^n}{e^x}=0,\qquad \lim_{x\to\infty}\frac{\log x}{x^a}=0

@pitfalls
- $\log(x+y)\neq\log x+\log y$ ! La règle transforme les **produits** en sommes.
- $a^x$ n'est défini ainsi que pour $a>0$.
- Pour dériver $x^x$ : écrire $e^{x\log x}$, d'où $x^x(\log x+1)$.

@cards
Définition du logarithme dans ce cours ? :: $\log x = \int_1^x\frac{dt}{t}$
Définition de l'exponentielle ? :: La fonction inverse du logarithme : $\exp = \log^{-1}$.
Définition de $a^x$ pour $a>0$ ? :: $a^x = e^{x\log a}$
Comment $\pi$ est-il défini ? :: Comme l'aire du disque unité : $2\int_{-1}^1\sqrt{1-x^2}\,dx$.
Dérivée de $\arcsin x$ ? :: $\dfrac{1}{\sqrt{1-x^2}}$
$\lim_{x\to\infty}x^n/e^x$ ? :: $0$ : l'exponentielle l'emporte sur toute puissance.
$\lim_{x\to0^+}x\log x$ ? :: $0$
$\lim_{n\to\infty}(1+1/n)^n$ ? :: $e$

@quiz
? Dans ce cours, le logarithme est défini par
+ $\log x = \int_1^x\frac{dt}{t}$
- l'inverse de la fonction $e^x$ supposée connue
- une série entière
- $\log x = \lim n(x^{1/n}-1)$
= On part de l'intégrale, puis on définit $\exp$ comme l'inverse de $\log$.
? Quelle est la dérivée de $a^x$ (avec $a>0$) ?
+ $a^x\log a$
- $x\,a^{x-1}$
- $a^x$
- $a^x/\log a$
= $a^x = e^{x\log a}$ et règle de la chaîne.
? Que vaut $\lim_{x\to+\infty}\dfrac{x^{100}}{e^x}$ ?
+ $0$
- $+\infty$
- $1$
- $100$
= L'exponentielle croît plus vite que toute puissance.
? La dérivée de $\arctan x$ est
+ $\dfrac1{1+x^2}$
- $\dfrac1{\sqrt{1-x^2}}$
- $\dfrac1{\cos^2x}$
- $-\dfrac1{1+x^2}$
= Dérivée de l'inverse : $1/\tan'(\arctan x) = 1/(1+x^2)$.
? Laquelle de ces égalités est FAUSSE ?
+ $\log(x+y) = \log x+\log y$
- $\log(xy) = \log x+\log y$
- $\log(1/x) = -\log x$
- $\log(x^2) = 2\log x$
= Le logarithme transforme les produits en sommes, pas les sommes en sommes.
? La dérivée de $x^x$ (pour $x>0$) est
+ $x^x(\log x+1)$
- $x\cdot x^{x-1}$
- $x^x\log x$
- $x^x$
= $x^x = e^{x\log x}$, dérivée de l'exposant : $\log x+1$.

@chapter convexes | 8. Fonctions convexes
@intro Une fonction est convexe quand son graphe est sous ses cordes. De cette idée simple découlent des inégalités puissantes : Jensen, Young, Hölder, Minkowski.

@section Définition
> $f:I\to\mathbb R$ est **convexe** si $f\big((1-t)x_0+tx_1\big)\le(1-t)f(x_0)+tf(x_1)$ pour tous $x_0,x_1\in I$, $t\in[0,1]$.
- Géométriquement : le graphe est **en dessous de chaque corde**.
- $f$ est **concave** si $-f$ est convexe (graphe au-dessus des cordes).
{{viz:convexe}}

@section Propriétés
- **Inégalité des pentes** : les pentes des cordes croissent quand on se déplace vers la droite.
- Une fonction convexe sur un intervalle ouvert a des dérivées à gauche et à droite partout, et elle est **continue**.
- Le graphe d'une fonction convexe dérivable est **au-dessus de ses tangentes** : $f(y)\ge f(x)+f'(x)(y-x)$.
> **Critère $C^2$** : si $f''\ge0$ sur $I$, alors $f$ est convexe.
ex: Convexes : $x^2$, $e^x$, $|x|$, $-\log x$. Concaves : $\log x$, $\sqrt x$.

@section Inégalité de Jensen
> Pour $f$ convexe, $\lambda_i\ge0$, $\sum\lambda_i = 1$ : $f\Big(\sum_i\lambda_ix_i\Big)\le\sum_i\lambda_if(x_i)$.
- « L'image de la moyenne est plus petite que la moyenne des images. »
- Application (avec $\log$ concave) : **moyenne géométrique ≤ moyenne arithmétique**, $\sqrt{ab}\le\dfrac{a+b}2$.

@section Dualité (transformée de Legendre)
- $f^*(p) := \sup_x\big(px-f(x)\big)$. $f^*$ est toujours convexe.
- Par définition : $px\le f(x)+f^*(p)$ (**inégalité de Fenchel–Young**).

@section Young, Hölder, Minkowski
- Exposants **conjugués** : $\dfrac1p+\dfrac1q = 1$ ($p,q>1$).
- **Young** : $ab\le\dfrac{a^p}p+\dfrac{b^q}q$ pour $a,b\ge0$.
- Norme $p$ : $\|x\|_p = \big(\sum_i|x_i|^p\big)^{1/p}$.
- **Hölder** : $\sum_i|x_iy_i|\le\|x\|_p\,\|y\|_q$ (pour $p=q=2$ : Cauchy–Schwarz).
- **Minkowski** : $\|x+y\|_p\le\|x\|_p+\|y\|_p$ (inégalité triangulaire pour $\|\cdot\|_p$).

@formulas
Convexité :: f((1-t)x_0+tx_1)\le(1-t)f(x_0)+tf(x_1)
Au-dessus des tangentes :: f(y)\ge f(x)+f'(x)(y-x)
Jensen :: f\Big(\sum_i\lambda_ix_i\Big)\le\sum_i\lambda_if(x_i),\quad \lambda_i\ge0,\ \sum\lambda_i=1
Legendre :: f^*(p)=\sup_x\,(px-f(x))
Young :: ab\le\frac{a^p}{p}+\frac{b^q}{q},\qquad \frac1p+\frac1q=1
Hölder :: \sum_i|x_iy_i|\le\|x\|_p\|y\|_q
Minkowski :: \|x+y\|_p\le\|x\|_p+\|y\|_p

@pitfalls
- Convexe : sous les cordes mais **au-dessus** des tangentes. Ne pas inverser.
- $f''\ge0$ suffit pour la convexité, mais une fonction convexe n'est pas forcément dérivable ($|x|$).
- Hölder exige des exposants conjugués : $1/p+1/q = 1$.

@cards
Définition d'une fonction convexe ? :: $f((1-t)x_0+tx_1)\le(1-t)f(x_0)+tf(x_1)$ pour $t\in[0,1]$ : graphe sous les cordes.
Critère de convexité pour $f\in C^2$ ? :: $f''\ge0$.
Inégalité de Jensen ? :: $f(\sum\lambda_ix_i)\le\sum\lambda_if(x_i)$ pour des poids positifs de somme 1.
Inégalité de Young ? :: $ab\le\frac{a^p}{p}+\frac{b^q}{q}$ avec $\frac1p+\frac1q=1$.
Inégalité de Hölder ? :: $\sum|x_iy_i|\le\|x\|_p\|y\|_q$
Inégalité de Minkowski ? :: $\|x+y\|_p\le\|x\|_p+\|y\|_p$
Transformée de Legendre ? :: $f^*(p)=\sup_x(px-f(x))$
Hölder avec $p=q=2$ s'appelle… ? :: L'inégalité de Cauchy–Schwarz.

@quiz
? Le graphe d'une fonction convexe est
+ en dessous de ses cordes
- au-dessus de ses cordes
- en dessous de ses tangentes
- une droite
= Et au-dessus de ses tangentes (quand elles existent).
? Laquelle de ces fonctions est convexe sur son domaine ?
+ $e^x$
- $\log x$
- $\sqrt x$
- $-x^2$
= $(e^x)'' = e^x>0$. Les trois autres sont concaves.
? Pour $f$ convexe, l'inégalité de Jensen donne
+ $f\!\left(\dfrac{x+y}2\right)\le\dfrac{f(x)+f(y)}2$
- $f\!\left(\dfrac{x+y}2\right)\ge\dfrac{f(x)+f(y)}2$
- $f(x+y)\le f(x)+f(y)$
- $f(x+y) = f(x)f(y)$
= Cas particulier avec deux points et des poids $1/2$.
? Pour $p = 3$, l'exposant conjugué $q$ vaut
+ $3/2$
- $3$
- $2/3$
- $1/3$
= $1/q = 1-1/3 = 2/3$.
? L'inégalité de Hölder avec $p = q = 2$ est
+ l'inégalité de Cauchy–Schwarz
- l'inégalité triangulaire
- l'inégalité de Jensen
- l'inégalité de Young
= $\sum|x_iy_i|\le\|x\|_2\|y\|_2$.
? Toute fonction convexe sur un intervalle ouvert est
+ continue
- dérivable
- de classe $C^2$
- bornée
= Elle a des dérivées à gauche et à droite en tout point, donc elle est continue ; mais pas forcément dérivable ($|x|$).
`);
