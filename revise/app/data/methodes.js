addCourse({ id: 'methodes', title: 'Méthodes mathématiques', sub: 'Cours 1 à 6 — outils de calcul pour la physique', color: '#7c5cff', icon: '∇' }, String.raw`
@chapter notation | 1. Notation, fonctions, limites
@intro Le vocabulaire de base : ensembles de nombres, nombres complexes, applications (injective, surjective, bijective), puis limites et continuité.

@section Les ensembles de nombres
- $\mathbb N = \{1,2,3,\dots\}$, $\mathbb N_0 = \{0,1,2,\dots\}$, $\mathbb Z$ (entiers), $\mathbb Q$ (rationnels $a/b$), $\mathbb R$ (réels), $\mathbb C$ (complexes).
- $\mathbb R_+ = \{r>0\}$ et $\mathbb R_{0+} = \{r \ge 0\}$.
- Constantes à connaître : $\sqrt2 \approx 1{,}414$, $e \approx 2{,}718$, $\pi \approx 3{,}1416$, $\gamma \approx 0{,}577$ (constante d'Euler).
- Un **irrationnel** est un réel qui ne s'écrit pas $a/b$. Exemple : $\sqrt 2$.
ex: **Preuve que $\sqrt2$ est irrationnel (par l'absurde).** Si $\sqrt2 = a/b$ sans diviseur commun, alors $a^2 = 2b^2$, donc $a$ est pair, donc $a^2$ est divisible par 4, donc $b^2$ est pair, donc $b$ est pair : $a$ et $b$ ont un diviseur commun. Contradiction.

@section Nombres complexes
- $z = x + iy$ avec $i^2 = -1$ ; $\mathrm{Re}(z) = x$, $\mathrm{Im}(z) = y$.
- **Module** : $\rho = |z| = \sqrt{x^2+y^2}$. **Argument** : $\varphi = \arg z$ (avec $\tan\varphi = y/x$).
- Forme polaire : $z = \rho(\cos\varphi + i\sin\varphi) = \rho\, e^{i\varphi}$.
- **Conjugué** : $\bar z = x - iy$ (symétrie par rapport à l'axe réel).
- $z\bar z = \rho^2$, $\mathrm{Re}(z) = \tfrac12(z+\bar z)$, $\mathrm{Im}(z) = \tfrac1{2i}(z-\bar z)$.
- $z$ réel $\iff z = \bar z$ ; $z$ imaginaire pur $\iff z = -\bar z$.
{{viz:complexe}}

@section Applications : injective, surjective, bijective
- Une application $f : A \to B$ associe à chaque point de son **domaine** $D(f)$ **une seule** image. L'ensemble des images est l'**image** $I(f)$.
- **Injective** : deux points différents ont des images différentes ($a \neq b \Rightarrow f(a) \neq f(b)$).
- **Surjective** : tout élément de $B$ est atteint ($I = B$).
- **Bijective** = injective + surjective. Alors l'inverse $f^{-1}$ existe et $f^{-1}(f(x)) = x$.
- **Composition** : $h = g\circ f$, $h(x) = g(f(x))$ (on applique $f$ d'abord).
- Une **fonction** est une application dont l'ensemble d'arrivée est $\mathbb R$ ou $\mathbb C$.
{{viz:fonctions}}
> **Théorème fondamental de l'algèbre** : tout polynôme de degré $n$ a exactement $n$ racines dans $\mathbb C$ (comptées avec multiplicité).

@section Fonctions trigonométriques et hyperboliques
- $\cos x = \dfrac{e^{ix}+e^{-ix}}{2}$, $\sin x = \dfrac{e^{ix}-e^{-ix}}{2i}$.
- $\cosh x = \dfrac{e^{x}+e^{-x}}{2}$, $\sinh x = \dfrac{e^{x}-e^{-x}}{2}$, $\tanh x = \dfrac{\sinh x}{\cosh x}$.
- Lien : $\cosh x = \cos(ix)$ et $\sinh x = -i\sin(ix)$.
- Sur $\mathbb R$ : $\sin$ et $\cos$ ne sont ni injectives ni surjectives ; $\tan$ est surjective mais pas injective.
! Attention au signe : $\cos^2 + \sin^2 = 1$ mais $\cosh^2 - \sinh^2 = 1$ ; $\cos 2x = \cos^2x - \sin^2x$ mais $\cosh 2x = \cosh^2x + \sinh^2x$.

@section Limites et continuité
- $\lim_{x\to x_0} f(x) = l$ signifie : pour tout $\epsilon>0$ il existe $\delta>0$ tel que $|f(x)-l|<\epsilon$ dès que $|x-x_0|<\delta$.
- Limite **à droite** ($x\to x_0^+$) et **à gauche** ($x \to x_0^-$) : on n'approche que d'un seul côté.
- $f$ est **continue en $x_0$** si $\lim_{x\to x_0} f(x) = f(x_0)$ : la limite existe ET vaut la valeur de la fonction.
- Continue à droite / à gauche : même chose avec la limite d'un seul côté.

@formulas
Module :: |z| = \sqrt{x^2+y^2},\quad z\bar z = |z|^2
Forme polaire :: z = \rho(\cos\varphi + i\sin\varphi) = \rho e^{i\varphi}
Addition (sin) :: \sin(x\pm y) = \sin x\cos y \pm \cos x \sin y
Addition (cos) :: \cos(x\pm y) = \cos x\cos y \mp \sin x \sin y
Angle double :: \sin 2x = 2\sin x\cos x,\quad \cos 2x = \cos^2x-\sin^2x
Hyperboliques :: \cosh^2x - \sinh^2x = 1
Euler :: e^{ix} = \cos x + i \sin x
Définition de la limite :: \forall\epsilon>0\ \exists\delta>0:\ |x-x_0|<\delta \Rightarrow |f(x)-l|<\epsilon

@pitfalls
- $\arg z = \arctan(y/x)$ n'est correct tel quel que pour $x>0$ : il faut regarder dans quel quadrant se trouve $z$.
- Injective ne veut pas dire surjective : $e^x$ de $\mathbb R$ dans $\mathbb R$ est injective mais pas surjective.
- Une fonction peut avoir une limite en $x_0$ sans être définie (ni continue) en $x_0$.

@cards
Que vaut $z\bar z$ ? :: $|z|^2 = x^2 + y^2$ (un réel positif).
Définition d'une application injective ? :: $a \neq b \Rightarrow f(a)\neq f(b)$ : deux antécédents différents n'ont jamais la même image.
Définition d'une application surjective ? :: L'image est tout l'ensemble d'arrivée : $I(f) = B$.
Exprimer $\cos x$ avec des exponentielles. :: $\cos x = \dfrac{e^{ix}+e^{-ix}}{2}$
Que dit le théorème fondamental de l'algèbre ? :: Tout polynôme de degré $n$ possède exactement $n$ racines complexes (avec multiplicités).
Quand $f$ est-elle continue en $x_0$ ? :: Quand $\lim_{x\to x_0} f(x) = f(x_0)$.
$\cosh^2 x - \sinh^2 x = $ ? :: $1$
Comment reconnaît-on un nombre réel avec le conjugué ? :: $z$ est réel si et seulement si $z = \bar z$.

@quiz
? Quel est le module de $z = 3 - 4i$ ?
+ $5$
- $7$
- $-1$
- $25$
= $|z| = \sqrt{3^2 + (-4)^2} = \sqrt{25} = 5$.
? La fonction $f:\mathbb R\to\mathbb R$, $f(x) = x^2$ est…
+ ni injective ni surjective
- injective mais pas surjective
- surjective mais pas injective
- bijective
= $f(-1) = f(1)$ donc pas injective ; les nombres négatifs ne sont jamais atteints donc pas surjective.
? Dans la preuve que $\sqrt2$ est irrationnel, quelle est la contradiction ?
+ $a$ et $b$ sont tous deux pairs alors qu'on les a supposés sans diviseur commun
- $a^2$ est négatif
- $b$ vaut zéro
- $\sqrt 2$ est plus grand que 2
= De $a^2 = 2b^2$ on déduit que $a$ puis $b$ sont pairs : ils ont 2 comme diviseur commun.
? Que vaut $\cosh(x)$ en fonction de $\cos$ ?
+ $\cos(ix)$
- $i\cos(x)$
- $-\cos(ix)$
- $\cos(x)/i$
= $\cos(ix) = \frac{e^{-x}+e^{x}}{2} = \cosh x$.
? Si $h = g\circ f$, alors $h(x) = $
+ $g(f(x))$
- $f(g(x))$
- $f(x)\,g(x)$
- $g(x) + f(x)$
= On applique d'abord $f$, puis $g$.
? Combien de racines complexes possède $x^5 - 3x + 1$ (avec multiplicités) ?
+ 5
- 1
- Entre 1 et 5, on ne peut pas savoir
- 3
= Théorème fondamental de l'algèbre : un polynôme de degré $n$ a exactement $n$ racines dans $\mathbb C$.
? $f$ est continue à droite en $x_0$ si…
+ $\lim_{x\to x_0^+} f(x) = f(x_0)$
- $\lim_{x\to x_0^-} f(x) = f(x_0)$
- $f$ est dérivable en $x_0$
- la limite à droite existe, quelle que soit sa valeur
= Il faut que la limite à droite existe ET soit égale à $f(x_0)$.

@chapter derivees | 2. Dérivées
@intro La dérivée mesure la pente locale d'une fonction. Ce chapitre donne la définition, les règles de calcul (dont la règle de la chaîne), les dérivées partielles et la lecture graphique de $f$, $f'$, $f''$.

@section Définition
- $f'(x_0) = \lim_{\epsilon\to0}\dfrac{f(x_0+\epsilon)-f(x_0)}{\epsilon}$ si la limite existe.
- Géométriquement : $f'(x_0)$ est la **pente de la tangente** au graphe en $x_0$. La sécante devient la tangente quand $\epsilon\to0$.
- Dérivées à droite $f'_+$ ($\epsilon\to0^+$) et à gauche $f'_-$ ($\epsilon\to0^-$).
- Notations : $f'$, $Df$, $\dfrac{df}{dx}$ ; en physique $\dot f$ pour une dérivée par rapport au temps.
{{viz:tangente}}
- $D$ est une application **non injective** : $D(f+c) = D(f)$ pour toute constante $c$.

@section Dérivées usuelles
- $(x^n)' = n x^{n-1}$, $(e^x)' = e^x$, $(\ln x)' = 1/x$
- $(\sin x)' = \cos x$, $(\cos x)' = -\sin x$
- $(\sinh x)' = \cosh x$, $(\cosh x)' = \sinh x$ (pas de signe moins !)
- $(\arctan x)' = \dfrac{1}{1+x^2}$

@section Règles de calcul
- **Linéarité** : $D(f+g) = Df + Dg$ et $D(\lambda f) = \lambda Df$. $D$ est une application linéaire.
- **Produit** : $(fg)' = f'g + fg'$
- **Inverse** : $(1/f)' = -f'/f^2$
- **Quotient** : $(g/f)' = \dfrac{g'f - gf'}{f^2}$
- **Règle de la chaîne** : $(g\circ f)' = (g'\circ f)\cdot f'$
ex: $\big(\sin^n x\big)' = n \sin^{n-1}(x)\cos x$. Et en chaîne multiple : $\big(\sin^3(1/x)\big)' = 3\sin^2(1/x)\cos(1/x)\cdot(-1/x^2)$.
> **Dérivée de la fonction inverse** : $D(f^{-1}) = \dfrac{1}{D(f)\circ f^{-1}}$ (on dérive $f\circ f^{-1} = x$).

@section Ordres supérieurs et dérivées partielles
- $f'' = (f')'$, et par récurrence $f^{(n)} = (f^{(n-1)})'$.
- **Dérivée partielle** $\dfrac{\partial f}{\partial x_i}$ : on dérive par rapport à $x_i$ en gardant les autres variables fixes.
- Pour $f:\mathbb R\to\mathbb R^n$, on dérive composante par composante : $f' = (f_1',\dots,f_n')$.

@section Lire un graphe avec f' et f''
- $f'(x_1) = 0$ : $x_1$ est un **point critique**.
- $f''(x_1) < 0$ : maximum local (fonction **concave**). $f''(x_1) > 0$ : minimum local (fonction **convexe**).
- **Point d'inflexion** : $f'' = 0$ avec changement de signe de $f''$ (la courbure change de sens).

@formulas
Définition :: f'(x_0) = \lim_{\epsilon\to 0}\frac{f(x_0+\epsilon)-f(x_0)}{\epsilon}
Produit :: (fg)' = f'g + fg'
Quotient :: \left(\frac{g}{f}\right)' = \frac{g'f-gf'}{f^2}
Règle de la chaîne :: (g\circ f)'(x) = g'(f(x))\, f'(x)
Fonction inverse :: (f^{-1})' = \frac{1}{f'\circ f^{-1}}
Arctangente :: (\arctan x)' = \frac{1}{1+x^2}

@pitfalls
- Oublier la dérivée « intérieure » dans la règle de la chaîne : $(\sin(x^2))' = 2x\cos(x^2)$, pas $\cos(x^2)$.
- $(\cosh x)' = +\sinh x$ alors que $(\cos x)' = -\sin x$.
- $f'(x_0) = 0$ ne suffit pas pour avoir un extremum (ex. $x^3$ en 0).

@cards
Définition de $f'(x_0)$ ? :: $\lim_{\epsilon\to0}\dfrac{f(x_0+\epsilon)-f(x_0)}{\epsilon}$
Règle de la chaîne ? :: $(g\circ f)' = (g'\circ f)\cdot f'$
Dérivée de $\arctan x$ ? :: $\dfrac{1}{1+x^2}$
Dérivée d'un quotient $g/f$ ? :: $\dfrac{g'f - gf'}{f^2}$
Pourquoi $D$ n'est-elle pas injective ? :: Car $D(f+c) = D(f)$ pour toute constante $c$.
$f'(x_1)=0$ et $f''(x_1)<0$ : nature de $x_1$ ? :: Un maximum local.
Qu'est-ce qu'un point d'inflexion ? :: Un point où $f''$ s'annule en changeant de signe (passage concave ↔ convexe).
Dérivée de $\ln x$ ? :: $1/x$

@quiz
? Quelle est la dérivée de $\sin(x^2)$ ?
+ $2x\cos(x^2)$
- $\cos(x^2)$
- $2x\sin(x)\cos(x)$
- $-2x\cos(x^2)$
= Règle de la chaîne : dérivée extérieure $\cos(x^2)$ fois dérivée intérieure $2x$.
? Que vaut $(\cosh x)'$ ?
+ $\sinh x$
- $-\sinh x$
- $\cosh x$
- $1/\cosh^2 x$
= Contrairement à $\cos$, il n'y a pas de signe moins.
? Si $f'(a)=0$ et $f''(a)>0$, alors $a$ est…
+ un minimum local
- un maximum local
- un point d'inflexion
- on ne peut rien dire
= Dérivée seconde positive : la fonction est convexe autour de $a$, c'est un minimum.
? La dérivée de $x\,e^x$ est
+ $(1+x)e^x$
- $e^x$
- $x e^x$
- $x^2 e^x$
= Règle du produit : $1\cdot e^x + x\cdot e^x$.
? Pour $f(x,y) = x^2y + y^3$, que vaut $\partial f/\partial y$ ?
+ $x^2 + 3y^2$
- $2xy$
- $2xy + 3y^2$
- $x^2$
= On dérive par rapport à $y$ en traitant $x$ comme une constante.
? Géométriquement, $f'(x_0)$ représente
+ la pente de la tangente au graphe en $x_0$
- l'aire sous la courbe jusqu'à $x_0$
- la valeur maximale de $f$
- la courbure du graphe en $x_0$
= La sécante de pente $\frac{f(x_0+\epsilon)-f(x_0)}{\epsilon}$ tend vers la tangente.
? Que vaut la dérivée de $1/f$ ?
+ $-f'/f^2$
- $1/f'$
- $f'/f^2$
- $-1/f^2$
= Cas particulier de la règle du quotient.

@chapter dl | 3. Développements limités
@intro Les développements limités (DL) approchent localement une fonction par un polynôme. C'est l'outil d'approximation numéro un en physique.

@section Formule de Taylor
- Idée : partir de $f(x) = f(a) + \int_a^x f'(y)\,dy$ et approximer $f'$ de mieux en mieux.
- Ordre 1 : $f(x)\approx f(a) + f'(a)(x-a)$ (la tangente).
- Ordre 2 : on ajoute $\dfrac{f''(a)}{2}(x-a)^2$ (la parabole osculatrice).
> **Théorème de Taylor** : $f(x) = \displaystyle\sum_{k=0}^{n}\frac{f^{(k)}(a)}{k!}(x-a)^k + R_n$ avec $R_n = \dfrac{f^{(n+1)}(\xi)}{(n+1)!}(x-a)^{n+1}$ pour un certain $\xi\in(a,x)$.
- Borne de l'erreur : $|R_n| \le \dfrac{C}{(n+1)!}|x-a|^{n+1}$ avec $C = \sup|f^{(n+1)}|$. L'erreur est petite si $x$ est proche de $a$.
{{viz:taylor}}

@section Définition d'un DL
- $f$ admet un $DL_n(a)$ si $f(x) = b_0 + b_1(x-a)+\dots+b_n(x-a)^n + (x-a)^n\epsilon(x)$ avec $\epsilon(x)\to0$ quand $x\to a$.
- Le polynôme est la **partie principale**. Si $f$ est $n+1$ fois dérivable, c'est le polynôme de Taylor.
- Il existe des fonctions non dérivables qui ont quand même un DL.

@section Propriétés
- **Unicité** : le DL, s'il existe, est unique.
- **Troncature** : un DL d'ordre $n$ donne un DL d'ordre $p$ pour tout $p\le n$.
- La limite de $f$ en $a$ vaut $b_0$.

@section Opérations
- **Somme** : on additionne les DL.
- **Produit** : on multiplie et on ne garde que les monômes de degré $\le n$.
- **Composition** $f\circ g$ : on remplace le DL de $g$ dans celui de $f$, on tronque à l'ordre $n$.
- **Primitive** : on intègre terme à terme → on gagne un ordre ($n+1$).
- **Dérivation** : on dérive terme à terme → on perd un ordre.

@section DL usuels en 0
- $e^x = 1 + x + \dfrac{x^2}{2!} + \dots + \dfrac{x^n}{n!} + \dots$
- $\sin x = x - \dfrac{x^3}{3!} + \dfrac{x^5}{5!} - \dots$ (impairs)
- $\cos x = 1 - \dfrac{x^2}{2!} + \dfrac{x^4}{4!} - \dots$ (pairs)
- $\dfrac{1}{1-x} = 1 + x + x^2 + \dots$
- $\ln(1+x) = x - \dfrac{x^2}{2} + \dfrac{x^3}{3} - \dots$
- $(1+x)^\alpha = 1 + \alpha x + \dfrac{\alpha(\alpha-1)}{2}x^2 + \dots$

@formulas
Taylor :: f(x) = \sum_{k=0}^{n} \frac{f^{(k)}(a)}{k!}(x-a)^k + R_n
Reste de Lagrange :: R_n = \frac{f^{(n+1)}(\xi)}{(n+1)!}(x-a)^{n+1},\ \xi\in(a,x)
Exponentielle :: e^x = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \dots
Sinus :: \sin x = x - \frac{x^3}{6} + \frac{x^5}{120} - \dots
Cosinus :: \cos x = 1 - \frac{x^2}{2} + \frac{x^4}{24} - \dots
Logarithme :: \ln(1+x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \dots
Puissance :: (1+x)^\alpha = 1 + \alpha x + \frac{\alpha(\alpha-1)}{2}x^2 + \dots

@pitfalls
- Un DL est **local** : il n'est précis que près du point $a$.
- Dans un produit ou une composition, il faut jeter tous les termes de degré supérieur à $n$ : ils ne sont pas fiables.
- Dériver un DL fait perdre un ordre ; intégrer en fait gagner un (sans oublier la constante $F(0)$).

@cards
Polynôme de Taylor d'ordre $n$ en $a$ ? :: $\sum_{k=0}^n \dfrac{f^{(k)}(a)}{k!}(x-a)^k$
Reste $R_n$ du théorème de Taylor ? :: $\dfrac{f^{(n+1)}(\xi)}{(n+1)!}(x-a)^{n+1}$ avec $\xi$ entre $a$ et $x$.
DL de $e^x$ en 0 ? :: $1 + x + \dfrac{x^2}{2!}+\dots+\dfrac{x^n}{n!}$
DL de $\sin x$ à l'ordre 3 ? :: $x - \dfrac{x^3}{6}$
DL de $\cos x$ à l'ordre 2 ? :: $1 - \dfrac{x^2}{2}$
DL de $\ln(1+x)$ à l'ordre 2 ? :: $x - \dfrac{x^2}{2}$
Que devient l'ordre d'un DL quand on l'intègre ? :: Il passe de $n$ à $n+1$.
Si $f$ admet un DL en $a$, que vaut $\lim_{x\to a} f$ ? :: Le coefficient constant $b_0$.

@quiz
? Quel est le DL à l'ordre 2 de $e^x$ en 0 ?
+ $1 + x + x^2/2$
- $1 + x + x^2$
- $x + x^2/2$
- $1 - x + x^2/2$
= Tous les $f^{(k)}(0)$ valent 1, donc les coefficients sont $1/k!$.
? Pour $x$ petit, $\sin x \approx$
+ $x - x^3/6$
- $1 - x^2/2$
- $x + x^3/6$
- $x - x^3/3$
= Les termes du sinus sont impairs et alternés : $x - x^3/3! + \dots$
? Le produit de deux DL d'ordre $n$ donne un DL d'ordre
+ $n$ (on tronque les monômes de degré $> n$)
- $2n$
- $n+1$
- $n-1$
= Les termes de degré supérieur à $n$ ne sont pas connus avec précision, il faut les jeter.
? Que vaut $\lim_{x\to0}\dfrac{1-\cos x}{x^2}$ ?
+ $1/2$
- $0$
- $1$
- $+\infty$
= $\cos x = 1 - x^2/2 + \dots$ donc $1-\cos x \approx x^2/2$.
? L'erreur $R_n$ est petite lorsque
+ $x$ est proche de $a$ et $f^{(n+1)}$ est petite
- $x$ est très loin de $a$
- $n$ est petit
- $f(a) = 0$
= $|R_n| \le \frac{C}{(n+1)!}|x-a|^{n+1}$ avec $C = \sup |f^{(n+1)}|$.
? En intégrant le DL de $\dfrac{1}{1+x} = 1 - x + x^2 - \dots$ on obtient celui de
+ $\ln(1+x)$
- $e^{-x}$
- $\arctan x$
- $\dfrac{1}{(1+x)^2}$
= $\int \frac{dx}{1+x} = \ln(1+x)$, d'où $x - x^2/2 + x^3/3 - \dots$
? Pour $x$ petit, $\sqrt{1+x}\approx$
+ $1 + x/2$
- $1 + x$
- $1 + 2x$
- $1 - x/2$
= $(1+x)^\alpha \approx 1 + \alpha x$ avec $\alpha = 1/2$. Très utilisé en physique.

@chapter grad | 4. Gradient, divergence, rotationnel
@intro L'analyse vectorielle : comment dériver des fonctions de plusieurs variables et des champs de vecteurs. Indispensable en mécanique et en électromagnétisme.

@section Dérivée partielle et dérivée directionnelle
- $f:\mathbb R^n\to\mathbb R$. $\partial_i f$ : dérivée par rapport à $x_i$, les autres variables restant fixes.
- **Dérivée directionnelle** dans la direction unitaire $\vec e$ : $\partial_{\vec e} f = \sum_i (\partial_i f)\,e_i = \nabla f\cdot\vec e$.
ex: $f = x_1^2 + x_2^2$, direction $\vec e = \frac{1}{\sqrt2}(1,1)$ : $\partial_{\vec e}f = \sqrt2\,(x_1 + x_2)$.
- **Matrice hessienne** : tableau des $n^2$ dérivées secondes $\partial_i\partial_j f$. Elle est **symétrique** si $f$ est assez régulière : $\partial_i\partial_j f = \partial_j\partial_i f$.

@section Gradient
- $\nabla f = \left(\dfrac{\partial f}{\partial x_1},\dots,\dfrac{\partial f}{\partial x_n}\right)$ : un **vecteur** fabriqué à partir d'un scalaire.
- Taylor à plusieurs variables : $f(\vec y) = f(\vec x) + \nabla f(\vec x)\cdot(\vec y-\vec x) + \dots$
> Le gradient pointe dans la direction de **plus forte croissance** de $f$ et il est **orthogonal aux courbes de niveau**.
- **Dérivée totale** (chaîne) : $\dfrac{d}{dx_j} g(f(x)) = \sum_i \dfrac{\partial g}{\partial y_i}\dfrac{\partial f_i}{\partial x_j}$.

@section Divergence et rotationnel
- **Divergence** (vecteur → scalaire) : $\nabla\cdot\vec f = \partial_x f_1 + \partial_y f_2 + \partial_z f_3$. Elle mesure les **sources** ($>0$) et les **puits** ($<0$) du champ.
- **Rotationnel** (vecteur → vecteur) : $\nabla\times\vec f = (\partial_y f_3 - \partial_z f_2,\ \partial_z f_1 - \partial_x f_3,\ \partial_x f_2 - \partial_y f_1)$. Il mesure les **tourbillons**.
{{viz:champ}}

@section Identités
- $\nabla\times(\nabla\phi) = 0$ : un gradient ne tourbillonne jamais.
- $\nabla\cdot(\nabla\times\vec A) = 0$ : un rotationnel n'a pas de source.
- $\nabla\times(\nabla\times \vec A) = \nabla(\nabla\cdot\vec A) - \nabla^2\vec A$
- $\nabla\cdot(\phi\vec A) = \vec A\cdot\nabla\phi + \phi\,\nabla\cdot\vec A$
- **Laplacien** : $\nabla^2 = \nabla\cdot\nabla = \partial_x^2 + \partial_y^2+\partial_z^2$

@section Coordonnées cylindriques et sphériques
- **Cylindriques** $(\rho,\phi,z)$ : $x = \rho\cos\phi$, $y = \rho\sin\phi$, $z = z$.
- **Sphériques** $(r,\theta,\phi)$ : $x = r\sin\theta\cos\phi$, $y = r\sin\theta\sin\phi$, $z = r\cos\theta$.
- Vecteurs de base : on dérive $\vec r$ par rapport à chaque coordonnée, **puis on normalise**. Ils dépendent du point !
- Gradient cylindrique : $\nabla f = \partial_\rho f\,\hat e_\rho + \dfrac1\rho\partial_\phi f\,\hat e_\phi + \partial_z f\,\hat e_z$
- Gradient sphérique : $\nabla f = \partial_r f\,\hat e_r + \dfrac1r\partial_\theta f\,\hat e_\theta + \dfrac{1}{r\sin\theta}\partial_\phi f\,\hat e_\phi$
{{viz:coords}}

@formulas
Gradient :: \nabla f = \left(\frac{\partial f}{\partial x},\frac{\partial f}{\partial y},\frac{\partial f}{\partial z}\right)
Dérivée directionnelle :: \partial_{\vec e} f = \nabla f\cdot \vec e,\quad |\vec e|=1
Divergence :: \nabla\cdot\vec f = \frac{\partial f_1}{\partial x}+\frac{\partial f_2}{\partial y}+\frac{\partial f_3}{\partial z}
Rotationnel :: \nabla\times\vec f = \begin{pmatrix}\partial_y f_3-\partial_z f_2\\ \partial_z f_1-\partial_x f_3\\ \partial_x f_2-\partial_y f_1\end{pmatrix}
Identités :: \nabla\times(\nabla\phi)=0,\qquad \nabla\cdot(\nabla\times\vec A)=0
Divergence sphérique (partie radiale) :: \nabla\cdot\vec f = \frac{1}{r^2}\frac{\partial}{\partial r}(r^2 f_r)+\dots
Laplacien cylindrique :: \nabla^2 f = \frac1\rho\frac{\partial}{\partial\rho}\!\left(\rho\frac{\partial f}{\partial\rho}\right)+\frac{1}{\rho^2}\frac{\partial^2 f}{\partial\phi^2}+\frac{\partial^2 f}{\partial z^2}

@pitfalls
- Gradient : scalaire → vecteur. Divergence : vecteur → scalaire. Rotationnel : vecteur → vecteur. Ne pas mélanger !
- La dérivée directionnelle exige un vecteur **unitaire**.
- En sphériques, ne pas oublier les facteurs $1/r$ et $1/(r\sin\theta)$ dans le gradient.

@cards
Que mesure la divergence d'un champ ? :: Les sources (div > 0) et les puits (div < 0) du champ.
Que mesure le rotationnel ? :: La présence et la force des tourbillons du champ.
Que vaut $\nabla\times(\nabla\phi)$ ? :: Toujours $0$.
Que vaut $\nabla\cdot(\nabla\times\vec A)$ ? :: Toujours $0$.
Direction du gradient par rapport aux courbes de niveau ? :: Il leur est orthogonal (et pointe vers les valeurs croissantes).
Coordonnées sphériques : $x, y, z$ = ? :: $x = r\sin\theta\cos\phi$, $y = r\sin\theta\sin\phi$, $z = r\cos\theta$
Définition du Laplacien ? :: $\nabla^2 = \nabla\cdot\nabla = \partial_x^2+\partial_y^2+\partial_z^2$
Qu'est-ce que la matrice hessienne ? :: La matrice (symétrique) des dérivées partielles secondes $\partial_i\partial_j f$.

@quiz
? Quel est le gradient de $f(x,y) = x^2 + y^2$ ?
+ $(2x,\,2y)$
- $2x + 2y$
- $(x,\,y)$
- $(2y,\,2x)$
= On dérive par rapport à chaque variable : $\partial_x f = 2x$, $\partial_y f = 2y$.
? Quelle est la divergence du champ $\vec f = (x, y, z)$ ?
+ $3$
- $0$
- $(1,1,1)$
- $x+y+z$
= $\partial_x x + \partial_y y + \partial_z z = 1+1+1$. Le champ « sort » de partout : source uniforme.
? Quel est le rotationnel du champ $\vec f = (-y, x, 0)$ ?
+ $(0, 0, 2)$
- $(0,0,0)$
- $2$
- $(0,0,-2)$
= Composante $z$ : $\partial_x f_2 - \partial_y f_1 = 1 - (-1) = 2$. C'est un tourbillon autour de l'axe $z$.
? Le rotationnel d'un gradient vaut
+ toujours zéro
- le Laplacien
- la divergence
- cela dépend de la fonction
= Identité $\nabla\times\nabla\phi = 0$ (égalité des dérivées croisées).
? Par rapport à une courbe de niveau de $f$, le vecteur $\nabla f$ est
+ orthogonal
- tangent
- nul
- à 45°
= Le long d'une courbe de niveau $f$ ne varie pas : $\nabla f\cdot(\vec y - \vec x) = 0$.
? En coordonnées sphériques, $z$ s'écrit
+ $r\cos\theta$
- $r\sin\theta$
- $r\sin\theta\cos\phi$
- $r\cos\phi$
= $\theta$ est l'angle mesuré depuis l'axe $z$.
? La divergence d'un champ de vecteurs de $\mathbb R^3$ est
+ une fonction scalaire
- un champ de vecteurs
- une matrice $3\times3$
- un nombre constant
= $\mathrm{div}:\ (\mathbb R^3\to\mathbb R^3)\ \mapsto\ (\mathbb R^3\to\mathbb R)$.

@chapter integrales | 5. Intégrales
@intro Primitive, intégrale de Riemann, théorème fondamental, et les deux techniques reines : intégration par parties et changement de variable.

@section Primitive (intégrale indéfinie)
- $F$ est une **primitive** de $f$ si $F' = f$.
- Comme la dérivation $D$ n'est pas injective, les primitives sont définies **à une constante près** : $F + c$.

@section Intégrale définie (Riemann)
- On découpe $[a,b]$ en $n$ intervalles de largeur $\Delta x = \frac{b-a}{n}$ et on somme les aires des rectangles : $\displaystyle\int_a^b f(x)\,dx = \lim_{n\to\infty}\sum_{i=1}^n f(x_i)\,\Delta x$.
- Pour $f\ge0$ c'est l'**aire sous le graphe**. Convention : $\int_a^b = -\int_b^a$.
- Erreur des rectangles : $\le C/n$. Erreur des **trapèzes** : $\le C/n^2$ (bien meilleur).
{{viz:riemann}}
- L'intégrale de **Lebesgue** généralise celle de Riemann aux fonctions très discontinues (ex. fonction valant 0 sur les rationnels et 1 ailleurs : intégrale 1 sur $[0,1]$).

@section Théorème fondamental
> Si $f$ est continue sur $[a,b]$ et $F$ est une primitive de $f$ : $\displaystyle\int_a^b f(x)\,dx = F(b) - F(a)$.
- Réciproquement, $F(x) = \int_a^x f(y)\,dy$ est une primitive de $f$.

@section Techniques de calcul
- **Linéarité** : $\int (f+g) = \int f + \int g$, $\int \lambda f = \lambda\int f$.
- **Intégration par parties** : $\displaystyle\int_a^b f\,g'\,dx = \big[f g\big]_a^b - \int_a^b f'\,g\,dx$
- **Changement de variable** $x = g(y)$ : $\displaystyle\int_a^b f(x)\,dx = \int_\alpha^\beta f(g(y))\,g'(y)\,dy$ avec $g(\alpha) = a$, $g(\beta) = b$.
- Recette : poser $x = g(y)$, écrire $dx = g'(y)\,dy$, **changer les bornes**.
! $g$ doit être bijective de $[\alpha,\beta]$ sur $[a,b]$.

@section Intégrales impropres
- Fonction non définie en $b$ : $\int_a^b f = \lim_{\epsilon\to0}\int_a^{b-\epsilon} f$.
- Intervalle infini : $\int_a^\infty f = \lim_{R\to\infty}\int_a^R f$.
- L'intégrale existe seulement si la limite existe. Ex. : $\int_1^\infty \frac{dx}{x^2} = 1$ mais $\int_1^\infty \frac{dx}{x}$ diverge.

@formulas
Somme de Riemann :: \int_a^b f(x)\,dx = \lim_{n\to\infty}\frac{b-a}{n}\sum_{i=1}^n f(x_i)
Théorème fondamental :: \int_a^b f(x)\,dx = F(b)-F(a)
Par parties :: \int_a^b f g'\,dx = [fg]_a^b - \int_a^b f' g\,dx
Changement de variable :: \int_a^b f(x)\,dx = \int_{\alpha}^{\beta} f(g(y))\,g'(y)\,dy
Intégrale impropre :: \int_a^\infty f(x)\,dx = \lim_{R\to\infty}\int_a^R f(x)\,dx

@pitfalls
- Oublier de changer les bornes (ou le $dx$) lors d'un changement de variable.
- Oublier la constante d'intégration pour une primitive.
- Par parties : bien choisir qui est dérivé ($f$) et qui est intégré ($g'$) — on veut que $f'g$ soit plus simple.

@cards
Théorème fondamental du calcul intégral ? :: $\int_a^b f(x)\,dx = F(b)-F(a)$ où $F' = f$.
Formule d'intégration par parties ? :: $\int_a^b fg' = [fg]_a^b - \int_a^b f'g$
Formule du changement de variable $x=g(y)$ ? :: $\int_a^b f(x)dx = \int_\alpha^\beta f(g(y))g'(y)dy$, avec $g(\alpha)=a$, $g(\beta)=b$.
Erreur de la méthode des rectangles vs trapèzes ? :: Rectangles : $\sim C/n$. Trapèzes : $\sim C/n^2$.
Comment définit-on $\int_a^\infty f$ ? :: $\lim_{R\to\infty}\int_a^R f(x)dx$, si la limite existe.
Pourquoi une primitive n'est-elle pas unique ? :: Car $(F+c)' = F'$ : la dérivation n'est pas injective.
$\int_a^b f = \;?\; \int_b^a f$ :: $\int_a^b f = -\int_b^a f$

@quiz
? Que vaut $\displaystyle\int_0^1 x^2\,dx$ ?
+ $1/3$
- $1/2$
- $1$
- $2$
= Primitive $x^3/3$, donc $1/3 - 0$.
? La formule d'intégration par parties vient de la règle de dérivation
+ du produit
- de la chaîne
- du quotient
- de la fonction inverse
= On intègre $(fg)' = f'g + fg'$ entre $a$ et $b$.
? Le changement de variable vient de la règle de dérivation
+ de la chaîne
- du produit
- du quotient
- de la somme
= C'est « l'inverse » de la règle de la chaîne.
? Que vaut $\displaystyle\int_0^{\pi} \sin x\,dx$ ?
+ $2$
- $0$
- $1$
- $\pi$
= $[-\cos x]_0^\pi = 1 + 1 = 2$.
? Que vaut $\displaystyle\int_1^\infty \frac{dx}{x^2}$ ?
+ $1$
- $+\infty$ (diverge)
- $0$
- $1/2$
= $[-1/x]_1^R = 1 - 1/R \to 1$.
? Avec $n$ sous-intervalles, l'erreur de la méthode des trapèzes décroît comme
+ $1/n^2$
- $1/n$
- $1/\sqrt n$
- $e^{-n}$
= L'interpolation linéaire gagne un ordre par rapport aux rectangles ($1/n$).
? Que vaut $\displaystyle\int_0^1 x\,e^x\,dx$ ?
+ $1$
- $e$
- $e - 1$
- $1/2$
= Par parties : $[xe^x]_0^1 - \int_0^1 e^x dx = e - (e-1) = 1$.

@chapter curvilignes | 6. Intégrales curvilignes
@intro Comment intégrer le long d'une courbe : longueur d'une courbe, paramétrisation, et travail d'une force le long d'un chemin.

@section Chemins et courbes
- Un **chemin** est une application continue $f:[a,b]\to\mathbb R^n$, $t\mapsto f(t)$. $t$ est le **paramètre**.
- Chemin **fermé** si $f(a) = f(b)$. La **trace** est l'ensemble des points parcourus.
- Deux chemins différents peuvent avoir la même trace : $(\cos t,\sin t)$ et $(\cos 2t, \sin 2t)$ (cercle parcouru une fois ou deux fois).
- Une **courbe** est une classe de chemins équivalents (mêmes points, reparamétrés de façon monotone). Un chemin est une **paramétrisation** de la courbe.
- Le graphe de $g$ est la trace du chemin $t\mapsto(t, g(t))$.

@section Vecteur tangent et longueur
- $f'(t_0) = (f_1'(t_0),\dots,f_n'(t_0))$ est **tangent** à la courbe ; $|f'(t_0)|$ est la **vitesse** de parcours.
- **Longueur** : $|\Gamma| = \displaystyle\int_a^b |f'(t)|\,dt = \int_a^b\sqrt{f_1'(t)^2+\dots+f_n'(t)^2}\,dt$
- Graphe de $g$ : $\displaystyle\int_a^b\sqrt{1+g'(t)^2}\,dt$. En polaires $r(\phi)$ : $\displaystyle\int\sqrt{r^2 + r'^2}\,d\phi$.
- La longueur **ne dépend pas** de la paramétrisation.
{{viz:arc}}

@section Paramétrisation par la longueur d'arc
- $\sigma(t) = \int_a^t |f'(\tau)|\,d\tau$ : longueur parcourue depuis le départ.
- On reparamètre par $s = \sigma(t)$ : $c(s) = f(\sigma^{-1}(s))$. C'est la **représentation canonique**.
- Alors $|c'(s)| = 1$ : on parcourt la courbe à vitesse 1.
- **Vecteur unité tangent** : $\hat e_0 = c'(s) = \dfrac{f'(t)}{|f'(t)|}$ — indépendant de la paramétrisation.

@section Intégrer le long d'une courbe
- **Champ scalaire** $g$ : $\displaystyle\int_\Gamma g\,dr = \int_a^b g(\vec r(t))\,|\vec r'(t)|\,dt$
- **Champ vectoriel** $\vec g$ : $\displaystyle\int_\Gamma \vec g\cdot d\vec r = \int_a^b \vec g(\vec r(t))\cdot\vec r'(t)\,dt$
> Si $\vec g$ est une force, l'intégrale curviligne vectorielle est le **travail** de la force le long du chemin.
- Recette : (1) paramétrer $\vec r(t)$, (2) calculer $\vec r'(t)$, (3) remplacer et intégrer sur $t$.
- Le résultat est indépendant de la paramétrisation choisie.

@formulas
Longueur d'une courbe :: |\Gamma| = \int_a^b |f'(t)|\,dt
Longueur d'un graphe :: L = \int_a^b \sqrt{1+g'(t)^2}\,dt
Longueur en polaires :: L = \int_\alpha^\beta \sqrt{r(\phi)^2 + r'(\phi)^2}\,d\phi
Longueur d'arc :: \sigma(t) = \int_a^t |f'(\tau)|\,d\tau
Vecteur unité tangent :: \hat e_0 = \frac{f'(t)}{|f'(t)|}
Intégrale curviligne scalaire :: \int_\Gamma g\,dr = \int_a^b g(\vec r(t))\,|\vec r'(t)|\,dt
Travail (intégrale vectorielle) :: \int_\Gamma \vec g\cdot d\vec r = \int_a^b \vec g(\vec r(t))\cdot \vec r'(t)\,dt

@pitfalls
- Chemin ≠ courbe ≠ trace : la trace oublie comment (et combien de fois) on parcourt les points.
- Dans l'intégrale scalaire on multiplie par la **norme** $|\vec r'|$ ; dans l'intégrale vectorielle on fait le **produit scalaire** avec $\vec r'$.
- La vitesse $|f'(t)|$ dépend de la paramétrisation, le vecteur unité tangent non.

@cards
Longueur d'une courbe paramétrée par $f(t)$ ? :: $\int_a^b |f'(t)|\,dt$
Longueur du graphe d'une fonction $g$ ? :: $\int_a^b\sqrt{1+g'(t)^2}\,dt$
Qu'est-ce que la paramétrisation canonique ? :: La paramétrisation par la longueur d'arc $s$ ; on y a $|c'(s)| = 1$.
Intégrale curviligne d'un champ vectoriel ? :: $\int_a^b \vec g(\vec r(t))\cdot\vec r'(t)\,dt$
Interprétation physique de $\int_\Gamma \vec F\cdot d\vec r$ ? :: Le travail de la force $\vec F$ le long de la courbe.
Qu'est-ce qu'un chemin fermé ? :: Un chemin dont le point initial et le point final coïncident : $f(a) = f(b)$.
Vecteur unité tangent ? :: $f'(t)/|f'(t)|$, indépendant de la paramétrisation.

@quiz
? Quelle est la longueur du chemin $f(t) = (\cos t, \sin t)$ pour $t\in[0, 2\pi]$ ?
+ $2\pi$
- $\pi$
- $1$
- $4\pi$
= $|f'(t)| = \sqrt{\sin^2t + \cos^2 t} = 1$, donc la longueur est $\int_0^{2\pi} 1\,dt = 2\pi$.
? Les chemins $(\cos t,\sin t)$ et $(\cos 2t,\sin 2t)$ sur $[0,2\pi]$
+ sont différents mais ont la même trace
- sont identiques
- ont des traces différentes
- ont la même longueur
= Le second parcourt le cercle deux fois : même trace, mais longueur $4\pi$ au lieu de $2\pi$.
? Pour la paramétrisation par la longueur d'arc $c(s)$, on a
+ $|c'(s)| = 1$
- $|c'(s)| = s$
- $c'(s) = 0$
- $|c(s)| = 1$
= Par construction on avance d'une unité de longueur par unité de paramètre.
? Le travail d'une force $\vec F$ le long d'une courbe $\Gamma$ est
+ $\int_\Gamma \vec F\cdot d\vec r$
- $\int_\Gamma |\vec F|\,dr$
- $\vec F\cdot(\vec r_B - \vec r_A)$ dans tous les cas
- $\nabla\cdot\vec F$
= C'est l'intégrale curviligne vectorielle ; seule la composante tangentielle de la force travaille.
? La longueur d'une courbe dépend-elle de la paramétrisation choisie ?
+ Non
- Oui, toujours
- Seulement pour les courbes fermées
- Seulement en dimension 3
= Toutes les paramétrisations équivalentes donnent la même longueur.
? Travail de $\vec F = (y, x)$ le long du segment de $(0,0)$ à $(1,1)$, paramétré par $\vec r(t) = (t,t)$ :
+ $1$
- $2$
- $0$
- $1/2$
= $\vec F(\vec r(t)) = (t,t)$, $\vec r' = (1,1)$, donc $\int_0^1 2t\,dt = 1$.
`);
