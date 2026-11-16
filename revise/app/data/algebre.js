addCourse({ id: 'algebre', title: 'Algèbre linéaire', sub: 'Polycopié 2026 — fin du chap. 4 (matrices) et chap. 5 (déterminant)', color: '#e0652f', icon: '▦' }, String.raw`
@chapter pivot | 4.5 Méthode du pivot revisitée
@intro Chaque opération de la méthode du pivot de Gauss revient à multiplier à gauche par une matrice « élémentaire » inversible. Conséquence : on peut calculer le rang, et factoriser toute matrice.

@section Les trois opérations = trois matrices élémentaires
- **Échanger** les lignes $i$ et $j$ : multiplier à gauche par $E_{i,j}$ (l'identité avec les lignes $i$ et $j$ échangées).
- **Ajouter** $\lambda\times$(ligne $j$) à la ligne $i$ : multiplier à gauche par $E_{i,j}(\lambda)$ (l'identité avec $\lambda$ en position $(i,j)$).
- **Multiplier** la ligne $i$ par $\lambda\neq0$ : multiplier à gauche par $E_i(\lambda)$ (l'identité avec $\lambda$ en position $(i,i)$).
> Astuce : la matrice élémentaire s'obtient en appliquant l'opération **à la matrice identité**.
{{viz:pivot}}

@section Elles sont toutes inversibles
- $E_{i,j}^{-1} = E_{i,j}$ (échanger deux fois = ne rien faire).
- $E_{i,j}(\lambda)^{-1} = E_{i,j}(-\lambda)$ (on retranche ce qu'on a ajouté).
- $E_i(\lambda)^{-1} = E_i(\lambda^{-1})$ (d'où la condition $\lambda\ne0$).
- Un produit $Q = Q_1\cdots Q_k$ de matrices inversibles est inversible, d'inverse $Q_k^{-1}\cdots Q_1^{-1}$ (**ordre inversé**).

@section Forme échelonnée et rang
> Pour toute $A\in M_{m,n}(K)$ il existe $Q\in M_m(K)$ **inversible** telle que $QA$ est échelonnée, avec $k$ pivots non nuls.
- Multiplier par une matrice inversible ne change pas le rang, donc $\mathrm{rang}(A) = k$ = **nombre de pivots**.
- On peut aller plus loin (forme échelonnée **réduite**) : rendre tous les pivots égaux à 1 (avec $E_i(1/\text{pivot})$), puis annuler les coefficients **au-dessus** des pivots (avec $E_{i,j}(\lambda)$).

@section À droite : opérations sur les colonnes
- Multiplier à **gauche** agit sur les **lignes** ; multiplier à **droite** par les mêmes matrices agit sur les **colonnes**.
- En permutant les colonnes pour amener les pivots en tête, on obtient : il existe $Q'\in M_m(K)$ et $P\in M_n(K)$ inversibles avec
- $$Q'AP = \begin{pmatrix} \mathrm{Id}_k & B\\ 0 & 0\end{pmatrix}$$
- On en déduit une factorisation de $A$ qui fait apparaître son rang $k$ (nouvelle preuve constructive du théorème 4.13).
ex: $A = \begin{pmatrix}2&2&4&6\\0&0&3&9\end{pmatrix}$ : diviser L1 par 2 et L2 par 3 donne $\begin{pmatrix}1&1&2&3\\0&0&1&3\end{pmatrix}$, puis $L_1\leftarrow L_1-2L_2$ donne $\begin{pmatrix}1&1&0&-3\\0&0&1&3\end{pmatrix}$. Rang 2.

@formulas
Échange de lignes :: E_{i,j}\cdot A = A\text{ avec lignes } i \text{ et } j \text{ échangées},\quad E_{i,j}^{-1}=E_{i,j}
Ajout d'un multiple :: E_{i,j}(\lambda)\cdot A:\ L_i\leftarrow L_i+\lambda L_j,\quad E_{i,j}(\lambda)^{-1}=E_{i,j}(-\lambda)
Multiplication d'une ligne :: E_i(\lambda)\cdot A:\ L_i\leftarrow\lambda L_i,\quad E_i(\lambda)^{-1}=E_i(\lambda^{-1})
Inverse d'un produit :: (Q_1Q_2\cdots Q_k)^{-1}=Q_k^{-1}\cdots Q_2^{-1}Q_1^{-1}
Forme normale :: Q'AP=\begin{pmatrix}\mathrm{Id}_k&B\\0&0\end{pmatrix},\quad k=\mathrm{rang}(A)

@pitfalls
- Gauche = lignes, droite = colonnes. Ne pas inverser.
- L'inverse d'un produit renverse l'ordre des facteurs.
- $E_i(\lambda)$ n'est inversible que si $\lambda\neq0$ : on n'a pas le droit de multiplier une ligne par 0.

@cards
Effet de $E_{i,j}\cdot A$ ? :: Échange les lignes $i$ et $j$ de $A$.
Effet de $E_{i,j}(\lambda)\cdot A$ ? :: Ajoute $\lambda$ fois la ligne $j$ à la ligne $i$.
Inverse de $E_{i,j}(\lambda)$ ? :: $E_{i,j}(-\lambda)$
Inverse de $E_i(\lambda)$ ? :: $E_i(\lambda^{-1})$, avec $\lambda\neq0$.
Comment lire le rang sur la forme échelonnée ? :: C'est le nombre de pivots (non nuls).
Multiplier $A$ à droite par une matrice élémentaire agit sur… ? :: Les colonnes de $A$.
$(Q_1Q_2)^{-1}$ = ? :: $Q_2^{-1}Q_1^{-1}$
Comment construire la matrice élémentaire d'une opération ? :: Appliquer l'opération à la matrice identité.

@quiz
? Quelle multiplication ajoute 3 fois la ligne 2 à la ligne 1 de $A$ ?
+ $E_{1,2}(3)\cdot A$
- $A\cdot E_{1,2}(3)$
- $E_{2,1}(3)\cdot A$
- $E_1(3)\cdot A$
= Multiplication à gauche (lignes), avec le coefficient 3 en position $(1,2)$.
? L'inverse de la matrice d'échange $E_{i,j}$ est
+ $E_{i,j}$ elle-même
- $-E_{i,j}$
- $E_{j,i}(-1)$
- elle n'est pas inversible
= Échanger deux fois les mêmes lignes redonne la matrice de départ.
? Le rang d'une matrice est égal
+ au nombre de pivots de sa forme échelonnée
- à son nombre de lignes
- au nombre de coefficients non nuls
- à son nombre de colonnes moins son nombre de lignes
= $QA$ échelonnée avec $Q$ inversible a le même rang que $A$, et ce rang est le nombre de pivots.
? Multiplier $A$ à droite par $E_{i,j}$
+ échange les colonnes $i$ et $j$
- échange les lignes $i$ et $j$
- ne change rien
- transpose $A$
= À droite, les matrices élémentaires agissent sur les colonnes.
? Si $Q = Q_1Q_2Q_3$ avec les $Q_i$ inversibles, alors $Q^{-1}$ vaut
+ $Q_3^{-1}Q_2^{-1}Q_1^{-1}$
- $Q_1^{-1}Q_2^{-1}Q_3^{-1}$
- $-Q_1Q_2Q_3$
- $Q$ n'est pas forcément inversible
= L'ordre s'inverse (comme chaussettes et chaussures).
? Pourquoi exige-t-on $\lambda\ne0$ dans $E_i(\lambda)$ ?
+ Pour que la matrice soit inversible
- Pour que le produit soit défini
- Par simple convention
- Pour garder des coefficients entiers
= Multiplier une ligne par 0 perd de l'information ; l'inverse $E_i(\lambda^{-1})$ n'existe que si $\lambda\neq0$.
? Quel est le rang de $\begin{pmatrix}2&2&4&6\\0&0&3&9\end{pmatrix}$ ?
+ 2
- 1
- 4
- 3
= La matrice est déjà échelonnée, avec deux pivots (2 et 3).

@chapter usages | 4.6 Des matrices à usages multiples
@intro Trois applications concrètes du produit matriciel : calculer la suite de Fibonacci, compter des chemins dans un graphe, et stocker des images.

@section Suite de Fibonacci
- $F_0 = 0$, $F_1 = 1$, $F_n = F_{n-1}+F_{n-2}$ : $0, 1, 1, 2, 3, 5, 8, 13,\dots$
- On pose $v_n = \begin{pmatrix}F_n\\F_{n-1}\end{pmatrix}$ et $A = \begin{pmatrix}1&1\\1&0\end{pmatrix}$. Alors $Av_n = v_{n+1}$.
> Donc $v_{n+1} = A^nv_1$ : une récurrence linéaire devient une **puissance de matrice**.
- Calculer $A^n$ efficacement sera possible grâce aux **valeurs propres et vecteurs propres** (suite du cours).

@section Chemins dans un graphe
- Un **graphe orienté** : des sommets $V = \{v_1,\dots,v_n\}$ et des arêtes orientées $E\subset V\times V$ (des flèches).
- **Matrice d'adjacence** : $a_{i,j} = 1$ s'il y a une arête de $v_i$ vers $v_j$, $0$ sinon.
> $(A^k)_{i,j}$ = **nombre de chemins de longueur $k$** de $v_i$ à $v_j$.
- Pourquoi ($k=2$) : $(A^2)_{i,j} = \sum_\ell a_{i,\ell}\,a_{\ell,j}$ compte les sommets intermédiaires $\ell$ tels que $v_i\to v_\ell\to v_j$. Le cas général se montre par récurrence.
{{viz:graphe}}

@section Stockage de données
- Une image en niveaux de gris de $m\times n$ pixels est une **matrice** $m\times n$ de nombres entre 0 (blanc) et 1 (noir).
- La factorisation de matrices permettra d'en obtenir des approximations qui prennent beaucoup moins de place (compression).

@formulas
Fibonacci :: \begin{pmatrix}F_{n+1}\\F_n\end{pmatrix}=\begin{pmatrix}1&1\\1&0\end{pmatrix}\begin{pmatrix}F_n\\F_{n-1}\end{pmatrix}
Puissance :: v_{n+1}=A^n v_1,\qquad v_1=\begin{pmatrix}1\\0\end{pmatrix}
Matrice d'adjacence :: a_{i,j}=\begin{cases}1&\text{si }(v_i,v_j)\in E\\0&\text{sinon}\end{cases}
Nombre de chemins :: (A^k)_{i,j}=\#\{\text{chemins de longueur }k\text{ de }v_i\text{ à }v_j\}
Coefficient d'un produit :: (AB)_{i,j}=\sum_{\ell}a_{i,\ell}\,b_{\ell,j}

@pitfalls
- Sens des indices : $a_{i,j}$ concerne l'arête de $v_i$ **vers** $v_j$ (ligne = départ, colonne = arrivée).
- $(A^k)_{i,j}$ compte les chemins de longueur **exactement** $k$, pas « au plus $k$ ».
- Un graphe orienté n'a en général pas une matrice d'adjacence symétrique.

@cards
Matrice qui engendre la suite de Fibonacci ? :: $A=\begin{pmatrix}1&1\\1&0\end{pmatrix}$, avec $A\begin{pmatrix}F_n\\F_{n-1}\end{pmatrix}=\begin{pmatrix}F_{n+1}\\F_n\end{pmatrix}$.
Définition de la matrice d'adjacence ? :: $a_{i,j}=1$ s'il existe une arête de $v_i$ vers $v_j$, sinon $0$.
Que compte $(A^k)_{i,j}$ ? :: Le nombre de chemins de longueur $k$ de $v_i$ à $v_j$.
Comment représente-t-on une image en niveaux de gris ? :: Par une matrice $m\times n$ de nombres entre 0 (blanc) et 1 (noir).
Formule du coefficient $(A^2)_{i,j}$ ? :: $\sum_\ell a_{i,\ell}a_{\ell,j}$
Quel outil donnera une formule pour $A^n$ ? :: Les valeurs propres et vecteurs propres.

@quiz
? Si $A$ est la matrice d'adjacence d'un graphe orienté, $(A^3)_{2,4}$ est
+ le nombre de chemins de longueur 3 de $v_2$ à $v_4$
- le nombre de chemins de longueur 3 de $v_4$ à $v_2$
- le nombre d'arêtes entre $v_2$ et $v_4$
- la distance entre $v_2$ et $v_4$
= Ligne = sommet de départ, colonne = sommet d'arrivée, puissance = longueur.
? Avec $A = \begin{pmatrix}1&1\\1&0\end{pmatrix}$, que vaut $A\begin{pmatrix}5\\3\end{pmatrix}$ ?
+ $\begin{pmatrix}8\\5\end{pmatrix}$
- $\begin{pmatrix}5\\8\end{pmatrix}$
- $\begin{pmatrix}8\\3\end{pmatrix}$
- $\begin{pmatrix}15\\5\end{pmatrix}$
= $(5+3,\ 5)$ : on passe de $(F_5,F_4)$ à $(F_6,F_5)$.
? Dans la matrice d'adjacence, $a_{i,j} = 1$ signifie
+ qu'il existe une arête de $v_i$ vers $v_j$
- qu'il existe une arête de $v_j$ vers $v_i$
- que $v_i$ et $v_j$ sont le même sommet
- qu'il existe un chemin quelconque de $v_i$ à $v_j$
= Uniquement les arêtes directes, dans le sens $i\to j$.
? Pourquoi $(A^2)_{i,j}$ compte-t-il les chemins de longueur 2 ?
+ Car $a_{i,\ell}a_{\ell,j} = 1$ exactement quand $v_i\to v_\ell\to v_j$ existe
- Car $A^2$ est symétrique
- Car le déterminant de $A$ vaut 1
- Car $A$ est inversible
= On somme sur tous les sommets intermédiaires $\ell$.
? Une image de $3\times4$ pixels en niveaux de gris est stockée dans
+ une matrice $3\times4$ de réels entre 0 et 1
- un vecteur de $\mathbb R^3$
- une matrice $4\times4$
- 12 matrices
= Un coefficient par pixel : 0 = blanc, 1 = noir.
? Que vaut $F_7$ ($F_0 = 0$, $F_1 = 1$) ?
+ 13
- 8
- 21
- 11
= $0,1,1,2,3,5,8,13$.

@chapter det | 5. Déterminant
@intro Le déterminant est un nombre associé à une matrice carrée. Il est non nul exactement quand la matrice est inversible, et il mesure le facteur par lequel la matrice multiplie les aires/volumes.

@section Cas 2×2
- $\mathrm{Det}\begin{pmatrix}a&b\\c&d\end{pmatrix} = ad-bc$.
- $ad-bc = 0$ ⟺ les deux colonnes sont sur une même droite passant par l'origine ⟺ rang $\le1$.
> $A\in M_2(K)$ est inversible ⟺ $\mathrm{Det}(A)\neq0$, et alors $A^{-1} = \dfrac{1}{\mathrm{Det}(A)}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$.
{{viz:det2}}

@section Définition générale (par récurrence)
- $A_{i,j}$ : matrice obtenue en **supprimant la ligne $i$ et la colonne $j$**.
- **Cofacteur** : $C_{i,j} = (-1)^{i+j}\,\mathrm{Det}(A_{i,j})$ (signes en damier $+\,-\,+\dots$).
> $\mathrm{Det}(A) = a_{1,1}C_{1,1}+a_{1,2}C_{1,2}+\dots+a_{1,n}C_{1,n}$ (**développement par la première ligne**).
- **Règle de Sarrus** ($n = 3$ uniquement !) : somme des 3 diagonales descendantes moins somme des 3 diagonales montantes.
- Matrice **diagonale ou triangulaire** : $\mathrm{Det}$ = **produit des termes diagonaux**.

@section Propriétés fondamentales
- **Multilinéaire** : linéaire en chaque colonne (et en chaque ligne) séparément.
- **Alterné** : deux lignes (ou colonnes) égales ⟹ $\mathrm{Det} = 0$.
- **Échanger** deux lignes (ou colonnes) change le **signe**.
- On peut développer par **n'importe quelle ligne ou colonne** : $\mathrm{Det}(A) = \sum_j a_{i,j}C_{i,j} = \sum_i a_{i,j}C_{i,j}$.
- $\mathrm{Det}(A^t) = \mathrm{Det}(A)$.
! Multilinéaire ≠ linéaire : $\mathrm{Det}(\lambda A) = \lambda^n\,\mathrm{Det}(A)$ et en général $\mathrm{Det}(A+B)\neq\mathrm{Det}(A)+\mathrm{Det}(B)$.

@section Effet des opérations du pivot
- Échange de deux lignes : $\mathrm{Det}\to-\mathrm{Det}$. ($\mathrm{Det}(E_{i,j}) = -1$)
- Multiplier une ligne par $\lambda$ : $\mathrm{Det}\to\lambda\,\mathrm{Det}$.
- Ajouter à une ligne un multiple d'une autre : $\mathrm{Det}$ **inchangé**.
> Méthode pratique : échelonner par le pivot en notant les échanges, puis multiplier les termes diagonaux.

@section Multiplicativité
> $\mathrm{Det}(AB) = \mathrm{Det}(A)\,\mathrm{Det}(B)$.
- Idée de preuve : toute application multilinéaire alternée $\varphi:(K^n)^n\to K$ est un multiple du déterminant : $\varphi(v_1,\dots,v_n) = \varphi(e_1,\dots,e_n)\cdot\mathrm{Det}(v_1|\dots|v_n)$. On l'applique à $\varphi(v_1,\dots,v_n) = \mathrm{Det}(Av_1|\dots|Av_n)$.
- Conséquence : si $A$ est inversible, $\mathrm{Det}(A^{-1}) = 1/\mathrm{Det}(A)$.

@formulas
Déterminant 2×2 :: \mathrm{Det}\begin{pmatrix}a&b\\c&d\end{pmatrix}=ad-bc
Inverse 2×2 :: A^{-1}=\frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}
Cofacteur :: C_{i,j}=(-1)^{i+j}\,\mathrm{Det}(A_{i,j})
Développement (ligne i) :: \mathrm{Det}(A)=\sum_{j=1}^{n}a_{i,j}\,C_{i,j}
Sarrus (n = 3) :: aei+bfg+cdh-ceg-afh-bdi\quad\text{pour }\begin{pmatrix}a&b&c\\d&e&f\\g&h&i\end{pmatrix}
Triangulaire :: \mathrm{Det}=\lambda_1\lambda_2\cdots\lambda_n
Transposée :: \mathrm{Det}(A^t)=\mathrm{Det}(A)
Multiplicativité :: \mathrm{Det}(AB)=\mathrm{Det}(A)\,\mathrm{Det}(B)
Multiple scalaire :: \mathrm{Det}(\lambda A)=\lambda^n\,\mathrm{Det}(A)

@pitfalls
- La règle de Sarrus ne marche **que** pour $n = 3$, jamais pour $n\ge4$.
- $\mathrm{Det}(A+B)\neq\mathrm{Det}(A)+\mathrm{Det}(B)$ en général.
- $\mathrm{Det}(\lambda A) = \lambda^n\mathrm{Det}(A)$, pas $\lambda\,\mathrm{Det}(A)$ : chaque ligne est multipliée par $\lambda$.
- Ne pas oublier le signe $(-1)^{i+j}$ des cofacteurs.

@cards
$\mathrm{Det}\begin{pmatrix}a&b\\c&d\end{pmatrix}$ ? :: $ad-bc$
Lien entre déterminant et inversibilité ? :: $A$ est inversible si et seulement si $\mathrm{Det}(A)\neq0$.
Inverse d'une matrice 2×2 ? :: $\dfrac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}$
Définition du cofacteur $C_{i,j}$ ? :: $(-1)^{i+j}\mathrm{Det}(A_{i,j})$, où $A_{i,j}$ est $A$ privée de la ligne $i$ et de la colonne $j$.
Déterminant d'une matrice triangulaire ? :: Le produit de ses termes diagonaux.
Effet d'un échange de deux lignes sur le déterminant ? :: Il change de signe.
Effet de $L_i\leftarrow L_i+\lambda L_j$ sur le déterminant ? :: Aucun.
$\mathrm{Det}(AB)$ = ? :: $\mathrm{Det}(A)\,\mathrm{Det}(B)$
$\mathrm{Det}(\lambda A)$ pour $A\in M_n$ ? :: $\lambda^n\mathrm{Det}(A)$
Que signifie « multilinéaire alterné » ? :: Linéaire en chaque colonne séparément, et nul dès que deux colonnes sont égales.

@quiz
? Que vaut $\mathrm{Det}\begin{pmatrix}2&3\\1&4\end{pmatrix}$ ?
+ $5$
- $11$
- $-5$
- $8$
= $2\cdot4-3\cdot1 = 5$.
? Une matrice carrée $A$ est inversible si et seulement si
+ $\mathrm{Det}(A)\neq0$
- $\mathrm{Det}(A) = 1$
- $\mathrm{Det}(A)>0$
- tous ses coefficients sont non nuls
= C'est LE rôle du déterminant.
? Si on échange deux lignes d'une matrice, son déterminant
+ change de signe
- ne change pas
- devient nul
- est multiplié par 2
= Le déterminant est une forme alternée.
? Pour $A\in M_3(\mathbb R)$, $\mathrm{Det}(2A)$ vaut
+ $8\,\mathrm{Det}(A)$
- $2\,\mathrm{Det}(A)$
- $6\,\mathrm{Det}(A)$
- $\mathrm{Det}(A)$
= Chacune des 3 lignes est multipliée par 2 : facteur $2^3$.
? Le déterminant de $\begin{pmatrix}2&7&1\\0&3&5\\0&0&4\end{pmatrix}$ vaut
+ $24$
- $9$
- $0$
- $59$
= Matrice triangulaire : produit des termes diagonaux $2\cdot3\cdot4$.
? Laquelle de ces affirmations est FAUSSE en général ?
+ $\mathrm{Det}(A+B) = \mathrm{Det}(A)+\mathrm{Det}(B)$
- $\mathrm{Det}(AB) = \mathrm{Det}(A)\mathrm{Det}(B)$
- $\mathrm{Det}(A^t) = \mathrm{Det}(A)$
- $\mathrm{Det}(A) = 0$ si deux colonnes sont égales
= Le déterminant est multiplicatif, pas additif.
? La règle de Sarrus s'applique
+ uniquement aux matrices $3\times3$
- à toutes les matrices carrées
- aux matrices $4\times4$ avec plus de diagonales
- uniquement aux matrices triangulaires
= Elle n'a aucun analogue pour $n\ge4$.
? Ajouter à une ligne un multiple d'une autre ligne
+ ne change pas le déterminant
- change son signe
- le multiplie par ce multiple
- l'annule
= Par linéarité, le terme ajouté est un déterminant avec deux lignes égales, donc nul.
? Le cofacteur $C_{2,3}$ d'une matrice $A$ est
+ $-\mathrm{Det}(A_{2,3})$
- $+\mathrm{Det}(A_{2,3})$
- $a_{2,3}$
- $-a_{2,3}\,\mathrm{Det}(A)$
= $(-1)^{2+3} = -1$.
? Si $\mathrm{Det}(A) = 3$ et $\mathrm{Det}(B) = -2$, alors $\mathrm{Det}(AB^{-1})$ vaut
+ $-3/2$
- $-6$
- $1$
- $5$
= $\mathrm{Det}(A)\cdot\frac{1}{\mathrm{Det}(B)} = 3/(-2)$.
`);
