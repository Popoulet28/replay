addCourse({ id: 'physmac', title: 'Physique macroscopique', sub: 'T. Giamarchi — thermodynamique', color: '#d6336c', icon: '♨' }, String.raw`
@chapter rappels | 1. Rappels et méthode
@intro Les « règles du jeu » : comment rédiger un calcul, vérifier un résultat par analyse dimensionnelle, et manipuler dérivées partielles et différentielles.

@section Conseils pratiques
- **Expliquer** ce que l'on fait : une courte phrase avant chaque étape clé. Répondre « oui » ou « non » sans justification ne vaut rien.
- Pas de calcul « adaptatif » (bricoler pour retomber sur la formule de l'énoncé). Si un résultat intermédiaire est absurde, le dire.
- Une courbe a toujours des **axes légendés** ; un résultat numérique a toujours une **unité**.
- Réfléchir avant de calculer, aller à l'économie, garder un calcul organisé pour pouvoir remonter à l'erreur.

@section Analyse dimensionnelle
- **Dimension** ≠ **unité** : le litre et le m³ sont deux unités de la même dimension (volume).
> Règle 1 : dans une somme ou une égalité, tous les termes ont la **même dimension**.
> Règle 2 : l'**argument** d'une fonction ($\exp$, $\sin$, $\ln$…) est **sans dimension** (car la série mélange toutes les puissances).
- Usage : vérifier un résultat, repérer une erreur, parfois deviner la forme d'une formule.
ex: Dans $e^{-E/k_BT}$, $E/k_BT$ doit être sans dimension : $k_BT$ est donc une énergie.

@section Dérivées partielles et différentielle
- Dérivée partielle $\left(\dfrac{\partial f}{\partial x}\right)_y$ : on dérive par rapport à $x$ en gardant $y$ **fixe**. En thermodynamique on indique toujours en indice la variable maintenue constante.
> **Différentielle** : $df = \left(\dfrac{\partial f}{\partial x}\right)_ydx+\left(\dfrac{\partial f}{\partial y}\right)_xdy$ — petite variation de $f$ quand $x$ et $y$ varient un peu.
- **Schwarz** : les dérivées croisées sont égales, $\dfrac{\partial^2f}{\partial x\partial y} = \dfrac{\partial^2f}{\partial y\partial x}$.
ex: Pour $P = Nk_BT/V$ : $\left(\frac{\partial P}{\partial T}\right)_V = \frac{Nk_B}{V}$ et $\left(\frac{\partial P}{\partial V}\right)_T = -\frac{Nk_BT}{V^2}$.

@formulas
Différentielle :: df=\left(\frac{\partial f}{\partial x}\right)_y dx+\left(\frac{\partial f}{\partial y}\right)_x dy
Dérivées croisées (Schwarz) :: \frac{\partial^2 f}{\partial x\,\partial y}=\frac{\partial^2 f}{\partial y\,\partial x}
Dimension d'une énergie :: [E]=M\,L^2\,T^{-2}
Dimension d'une pression :: [P]=\frac{[F]}{[S]}=M\,L^{-1}\,T^{-2}

@pitfalls
- Un résultat numérique sans unité n'a aucun sens.
- Additionner deux termes de dimensions différentes signale une erreur dans le calcul.
- Une dérivée partielle dépend de la variable qu'on garde constante : $\left(\frac{\partial U}{\partial T}\right)_V\neq\left(\frac{\partial U}{\partial T}\right)_P$ en général.

@cards
Différence entre unité et dimension ? :: La dimension est la nature physique (longueur, masse…) ; l'unité est l'étalon choisi pour la mesurer (m, km…).
Que doit vérifier l'argument d'une exponentielle ou d'un sinus ? :: Il doit être sans dimension.
Différentielle de $f(x,y)$ ? :: $df = \left(\frac{\partial f}{\partial x}\right)_ydx+\left(\frac{\partial f}{\partial y}\right)_xdy$
Règle sur les termes d'une somme ? :: Ils doivent tous avoir la même dimension.
Que signifie l'indice dans $\left(\frac{\partial f}{\partial x}\right)_y$ ? :: Que $y$ est maintenue constante pendant la dérivation.
Théorème de Schwarz ? :: Les dérivées partielles croisées sont égales.

@quiz
? Dans l'expression $e^{-mgz/X}$, la grandeur $X$ doit avoir la dimension
+ d'une énergie
- d'une longueur
- d'une force
- d'aucune dimension
= L'argument de l'exponentielle est sans dimension, et $mgz$ est une énergie.
? Le litre et le mètre cube sont
+ deux unités de la même dimension
- deux dimensions différentes
- la même unité
- incomparables
= Tous deux mesurent un volume ; on peut les convertir l'un en l'autre.
? Pour $f(x,y) = x^2y$, la différentielle $df$ vaut
+ $2xy\,dx+x^2\,dy$
- $2x\,dx+dy$
- $x^2y\,(dx+dy)$
- $2xy\,dy+x^2\,dx$
= $\partial f/\partial x = 2xy$ et $\partial f/\partial y = x^2$.
? Un calcul vous amène à écrire « pression + énergie ». Vous en concluez que
+ il y a une erreur : il manque un facteur quelque part
- c'est acceptable si les valeurs numériques sont proches
- il faut convertir les unités
- le résultat est sans dimension
= On ne peut additionner que des grandeurs de même dimension.
? Pour un gaz parfait $P = Nk_BT/V$, que vaut $\left(\frac{\partial P}{\partial V}\right)_T$ ?
+ $-Nk_BT/V^2$
- $Nk_B/V$
- $Nk_BT/V$
- $-Nk_B/V^2$
= On dérive $1/V$ en gardant $T$ fixe.
? Pourquoi l'argument d'un sinus doit-il être sans dimension ?
+ Parce que son développement en série additionne toutes les puissances de l'argument
- Par simple convention
- Parce que le sinus est borné
- Parce qu'un angle se mesure en degrés
= $\sin x = x-x^3/6+\dots$ : $x$ et $x^3$ doivent avoir la même dimension.

@chapter notions | 2. Notions de base
@intro Impossible de suivre $10^{23}$ particules une à une. La thermodynamique décrit le système avec quelques variables macroscopiques reliées par une équation d'état.

@section Du problème à N corps aux variables macroscopiques
- Un gaz macroscopique contient $\sim10^{23}$ particules (nombre d'Avogadro $N_A\approx6\times10^{23}$) : résoudre les équations de Newton est impossible… et inutile.
- On décrit le système par quelques **variables macroscopiques** : $P$, $V$, $T$, $N$.
- **Extensive** : proportionnelle à la taille du système ($V$, $N$, $U$, $S$) — elle double si on double le système.
- **Intensive** : indépendante de la taille ($P$, $T$, densité $N/V$).
- Le rapport de deux extensives est intensif. **Limite thermodynamique** : $N\to\infty$, $V\to\infty$ avec $N/V$ fixé.
- **Précision** : les fluctuations relatives sont d'ordre $1/\sqrt N\sim10^{-11}$ : les variables macroscopiques sont extrêmement bien définies.

@section Pression et température
- **Pression** : force par unité de surface due aux chocs des particules sur la paroi. Unité : pascal ; 1 bar = $10^5$ Pa ≈ 1 atm.
- **Température** : deux systèmes en contact thermique finissent à la même température (**équilibre thermique**). Échelle absolue en kelvins : $T(\text{K}) = T(°\text{C})+273{,}15$.
{{viz:gazparfait}}

@section Équation d'état du gaz parfait
- **Boyle–Mariotte** : à $T$ fixée, $PV = $ cste.
- **Charles / Gay-Lussac** : à $P$ fixée, $V\propto T$ ; à $V$ fixé, $P\propto T$.
- **Avogadro** : à $P$ et $T$ fixées, $V\propto N$ quel que soit le gaz.
> **Gaz parfait** : $PV = Nk_BT = nRT$, avec $k_B = 1{,}38\times10^{-23}$ J/K, $R = N_Ak_B = 8{,}31$ J/(mol·K).
- Valable pour un gaz dilué (interactions négligeables).
- Une équation d'état relie les variables : seules deux parmi ($P$, $V$, $T$) sont indépendantes (à $N$ fixé).
- Autres systèmes : pour un **aimant**, les variables sont l'aimantation $M$, le champ $H$ et $T$.

@formulas
Gaz parfait :: PV=Nk_BT=nRT
Constantes :: k_B=1{,}38\times10^{-23}\ \mathrm{J/K},\qquad R=N_Ak_B=8{,}31\ \mathrm{J\,mol^{-1}K^{-1}}
Boyle–Mariotte :: PV=\text{cste}\quad(T\text{ fixée})
Kelvin :: T(\mathrm K)=T(^\circ\mathrm C)+273{,}15
Fluctuations relatives :: \frac{\Delta X}{X}\sim\frac{1}{\sqrt N}

@pitfalls
- Toujours utiliser la température en **kelvins** dans $PV = Nk_BT$.
- Ne pas confondre $N$ (nombre de particules, avec $k_B$) et $n$ (nombre de moles, avec $R$).
- $P$ et $T$ sont intensives : elles ne s'additionnent pas quand on réunit deux systèmes.

@cards
Équation d'état du gaz parfait ? :: $PV = Nk_BT = nRT$
Variable extensive : définition et exemples ? :: Proportionnelle à la taille du système : $V$, $N$, $U$, $S$.
Variable intensive : définition et exemples ? :: Indépendante de la taille : $P$, $T$, densité.
Qu'est-ce que la limite thermodynamique ? :: $N\to\infty$ et $V\to\infty$ à densité $N/V$ fixée.
Loi de Boyle–Mariotte ? :: À température fixée, $PV$ est constant.
Ordre de grandeur des fluctuations relatives ? :: $1/\sqrt N$ (≈ $10^{-11}$ pour un système macroscopique).
Combien de variables indépendantes pour un gaz ($N$ fixé) ? :: Deux parmi $P$, $V$, $T$ (la troisième est donnée par l'équation d'état).
Lien entre $R$ et $k_B$ ? :: $R = N_Ak_B$

@quiz
? Laquelle de ces grandeurs est intensive ?
+ La température
- Le volume
- L'énergie interne
- Le nombre de particules
= Si l'on réunit deux systèmes identiques, la température ne double pas.
? On double le volume d'un gaz parfait à température constante. Sa pression
+ est divisée par 2
- double
- ne change pas
- est divisée par 4
= Boyle–Mariotte : $PV$ = cste.
? À volume constant, on fait passer un gaz parfait de 300 K à 600 K. Sa pression
+ double
- est divisée par 2
- augmente de 300 Pa
- ne change pas
= $P\propto T$ à volume fixé (avec $T$ en kelvins).
? Pourquoi peut-on décrire un gaz par si peu de variables ?
+ Car les fluctuations relatives, en $1/\sqrt N$, sont infimes pour $N\sim10^{23}$
- Car les particules sont immobiles
- Car toutes les particules ont la même vitesse
- Car il n'y a que quelques particules
= Les moyennes macroscopiques sont extrêmement précises.
? Le rapport de deux grandeurs extensives est
+ intensif
- extensif
- sans dimension
- nul à la limite thermodynamique
= Exemple : la densité $N/V$.
? Combien y a-t-il de particules dans une mole ?
+ environ $6\times10^{23}$
- environ $10^{10}$
- environ $1{,}38\times10^{-23}$
- environ $8{,}31$
= C'est le nombre d'Avogadro $N_A$.

@chapter premier | 3. Premier principe
@intro L'énergie se conserve : l'énergie interne d'un système varie par échange de travail et de chaleur. Travail et chaleur dépendent du chemin suivi, mais pas leur somme.

@section Travail et chaleur
- **Travail reçu** par un gaz : $\delta W = -P\,dV$. Compression ($dV<0$) : $\delta W>0$ ; détente : $\delta W<0$ (le gaz fournit du travail).
- Sur une transformation finie : $W = -\displaystyle\int_{V_i}^{V_f}P\,dV$ = (moins) l'**aire sous la courbe** dans le diagramme $(P,V)$.
ex: Isotherme réversible d'un gaz parfait : $W = -Nk_BT\ln\dfrac{V_f}{V_i}$.
- **Chaleur** $Q$ : énergie échangée sans travail (contact thermique). **Capacités calorifiques** : $\delta Q = C_V\,dT$ (à $V$ constant), $\delta Q = C_P\,dT$ (à $P$ constante).
! $W$ et $Q$ **dépendent du chemin** suivi, pas seulement des états initial et final : ce ne sont pas des fonctions d'état (d'où la notation $\delta$).
{{viz:pv}}

@section Le premier principe
> Il existe une **fonction d'état**, l'énergie interne $U$, telle que $dU = \delta W+\delta Q$, soit $\Delta U = W+Q$.
- $\Delta U$ ne dépend que des états initial et final. Sur un **cycle** : $\Delta U = 0$.
- Convention : $W$ et $Q$ sont comptés positivement quand ils sont **reçus** par le système.

@section Formes différentielles exactes
- $\omega = A(x,y)\,dx+B(x,y)\,dy$ est **exacte** (= différentielle d'une fonction) ⟺ $\dfrac{\partial A}{\partial y} = \dfrac{\partial B}{\partial x}$.
- Exacte ⟺ son intégrale ne dépend pas du chemin ⟺ fonction d'état. $dU$ est exacte ; $\delta W$ et $\delta Q$ ne le sont pas.
ex: $xy\,dx+\tfrac12x^2\,dy$ est exacte (c'est $d(\tfrac12x^2y)$) ; $xy\,dx+x^2\,dy$ ne l'est pas.

@section Conséquences pour le gaz parfait
- **Loi de Joule** : l'énergie interne d'un gaz parfait ne dépend que de $T$ : $dU = C_V\,dT$. (Monoatomique : $U = \tfrac32Nk_BT$.)
> **Relation de Mayer** : $C_P-C_V = Nk_B$. On note $\gamma = C_P/C_V>1$ (5/3 monoatomique, 7/5 diatomique).

@section Transformations particulières
- **Réversible** (quasi-statique) : suite d'états d'équilibre ; la pression du gaz égale la pression extérieure à chaque instant.
- **Isochore** ($V$ cst) : $W = 0$, $\Delta U = Q$. **Isobare** ($P$ cste) : $W = -P\,\Delta V$. **Isotherme** (gaz parfait) : $\Delta U = 0$, $Q = -W$.
- **Adiabatique** : $\delta Q = 0$, donc $\Delta U = W$.
> **Loi de Laplace** (adiabatique réversible d'un gaz parfait) : $PV^\gamma = $ cste, ou $TV^{\gamma-1} = $ cste.
- **Détente de Joule–Gay-Lussac** (détente dans le vide, parois isolées) : $W = 0$, $Q = 0$ ⟹ $\Delta U = 0$ ⟹ pour un gaz parfait, $T$ ne change pas. Irréversible.
- **Détente de Joule–Thomson** (à travers un bouchon poreux) : l'**enthalpie** $H = U+PV$ est conservée. À pression constante, $\Delta H = Q$ et $C_P = \left(\dfrac{\partial H}{\partial T}\right)_P$.

@formulas
Travail reçu :: \delta W=-P\,dV,\qquad W=-\int_{V_i}^{V_f}P\,dV
Isotherme réversible (gaz parfait) :: W=-Nk_BT\ln\frac{V_f}{V_i}
Premier principe :: dU=\delta W+\delta Q
Forme exacte :: A\,dx+B\,dy\ \text{exacte}\iff\frac{\partial A}{\partial y}=\frac{\partial B}{\partial x}
Loi de Joule :: dU=C_V\,dT
Relation de Mayer :: C_P-C_V=Nk_B
Loi de Laplace :: PV^\gamma=\text{cste},\qquad \gamma=\frac{C_P}{C_V}
Enthalpie :: H=U+PV

@pitfalls
- Signe du travail : $\delta W = -P\,dV$ est le travail **reçu**. Une détente coûte de l'énergie au gaz.
- Adiabatique ($Q = 0$) ne veut pas dire isotherme : dans une compression adiabatique, $T$ augmente.
- La loi de Laplace n'est valable que pour une adiabatique **réversible** (pas pour Joule–Gay-Lussac).

@cards
Énoncé du premier principe ? :: $dU = \delta W+\delta Q$, où $U$ est une fonction d'état.
Travail élémentaire reçu par un gaz ? :: $\delta W = -P\,dV$
Travail d'une isotherme réversible de gaz parfait ? :: $W = -Nk_BT\ln(V_f/V_i)$
Relation de Mayer ? :: $C_P-C_V = Nk_B$
Loi de Laplace ? :: $PV^\gamma = $ cste pour une adiabatique réversible de gaz parfait.
Critère pour qu'une forme $A\,dx+B\,dy$ soit exacte ? :: $\partial A/\partial y = \partial B/\partial x$
Que se passe-t-il dans la détente de Joule–Gay-Lussac ? :: $W = Q = 0$, donc $\Delta U = 0$ ; la température d'un gaz parfait ne change pas.
Définition de l'enthalpie ? :: $H = U+PV$ ; conservée dans la détente de Joule–Thomson.
De quoi dépend l'énergie interne d'un gaz parfait ? :: De la température seulement (loi de Joule).
Pourquoi écrit-on $\delta W$ et non $dW$ ? :: Car le travail n'est pas une fonction d'état : il dépend du chemin suivi.

@quiz
? Lors d'une compression, le travail reçu par le gaz est
+ positif
- négatif
- nul
- égal à la chaleur reçue
= $\delta W = -P\,dV$ avec $dV<0$.
? Laquelle de ces grandeurs est une fonction d'état ?
+ L'énergie interne $U$
- Le travail $W$
- La chaleur $Q$
- Aucune des trois
= $W$ et $Q$ dépendent du chemin, mais leur somme $\Delta U$ non.
? Pour un gaz parfait, $C_P-C_V$ vaut
+ $Nk_B$
- $0$
- $\gamma$
- $\tfrac32Nk_B$
= Relation de Mayer.
? Lors d'une détente adiabatique réversible d'un gaz parfait, la température
+ diminue
- augmente
- reste constante
- on ne peut pas savoir
= Le gaz fournit du travail sans recevoir de chaleur : $U$ donc $T$ diminue ($TV^{\gamma-1}$ = cste).
? Dans la détente de Joule–Gay-Lussac d'un gaz parfait (dans le vide, enceinte isolée),
+ la température reste constante
- la température diminue
- le gaz fournit un travail
- l'énergie interne diminue
= $W = 0$ et $Q = 0$ donc $\Delta U = 0$, et $U$ ne dépend que de $T$.
? La forme différentielle $y\,dx+x\,dy$ est
+ exacte : c'est $d(xy)$
- non exacte
- nulle
- exacte : c'est $d(x+y)$
= $\partial A/\partial y = 1 = \partial B/\partial x$.
? Au cours d'un cycle complet,
+ $\Delta U = 0$ donc $W = -Q$
- $W = 0$ et $Q = 0$
- $\Delta U = W$
- $Q = 0$
= $U$ est une fonction d'état : elle revient à sa valeur initiale.
? Dans le diagramme $(P,V)$, en un même point, la courbe adiabatique est
+ plus pentue que l'isotherme
- moins pentue que l'isotherme
- confondue avec l'isotherme
- horizontale
= $P\propto V^{-\gamma}$ avec $\gamma>1$, contre $P\propto V^{-1}$.

@chapter second | 4. Second principe
@intro L'entropie est une nouvelle fonction d'état qui distingue le possible de l'impossible : l'entropie de l'univers ne peut qu'augmenter. Elle mène aux potentiels thermodynamiques.

@section Entropie : le facteur intégrant
- $\delta Q$ n'est pas une différentielle exacte, mais $\delta Q_{rév}/T$ en est une : $1/T$ est un **facteur intégrant**.
> **Entropie** : $dS = \dfrac{\delta Q_{rév}}{T}$. $S$ est une fonction d'état, extensive, en J/K.
- Gaz parfait : $S = C_V\ln T+Nk_B\ln V+\text{cste}$.
- Cohérence : pour une adiabatique réversible, $\Delta S = 0$ redonne la loi de Laplace.

@section Réversible ou irréversible ?
- **Joule–Gay-Lussac** : $Q = 0$ et pourtant $\Delta S = Nk_B\ln\dfrac{V_f}{V_i}>0$. L'entropie a été **créée**.
- Pour calculer $\Delta S$ d'une transformation irréversible : $S$ étant une fonction d'état, on imagine un chemin **réversible** entre les mêmes états.
- Piston comprimé brutalement : là encore $\Delta S_{univers}>0$.

@section Énoncé du second principe
> Pour un système **isolé**, $\Delta S\ge0$. Égalité ⟺ transformation réversible. « L'entropie de l'univers ne peut qu'augmenter. »
- Pour un système en contact avec une source à $T_0$ : $dS\ge\dfrac{\delta Q}{T_0}$.
- **Source de chaleur** (thermostat) : système si grand que sa température ne change pas ; $\Delta S_{source} = Q_{source}/T_0$.
- Conséquence : la chaleur va spontanément du **chaud vers le froid**.
ex: Solide (capacité $C$, température $T_1$) plongé dans une source à $T_0$ : $\Delta S_{solide} = C\ln\frac{T_0}{T_1}$, $\Delta S_{source} = C\frac{T_1-T_0}{T_0}$, et la somme est toujours $\ge0$.
{{viz:entropie}}

@section Potentiels thermodynamiques
> **Identité thermodynamique** : $dU = T\,dS-P\,dV$. Donc $T = \left(\dfrac{\partial U}{\partial S}\right)_V$, $P = -\left(\dfrac{\partial U}{\partial V}\right)_S$.
- **Enthalpie** $H = U+PV$ : $dH = T\,dS+V\,dP$ — variables $(S,P)$.
- **Énergie libre** $F = U-TS$ : $dF = -S\,dT-P\,dV$ — variables $(T,V)$.
- **Enthalpie libre** $G = U-TS+PV$ : $dG = -S\,dT+V\,dP$ — variables $(T,P)$.
- On passe de l'un à l'autre par **transformation de Legendre** : on échange une variable contre sa conjuguée ($S\leftrightarrow T$, $V\leftrightarrow P$).
- À $T$ et $V$ fixés, l'équilibre **minimise $F$** ; à $T$ et $P$ fixés, il **minimise $G$**.
- **Relations de Maxwell** (égalité des dérivées croisées) : ex. de $dF$ : $\left(\dfrac{\partial S}{\partial V}\right)_T = \left(\dfrac{\partial P}{\partial T}\right)_V$ ; de $dU$ : $\left(\dfrac{\partial T}{\partial V}\right)_S = -\left(\dfrac{\partial P}{\partial S}\right)_V$.

@formulas
Entropie :: dS=\frac{\delta Q_{r\acute ev}}{T}
Entropie du gaz parfait :: S=C_V\ln T+Nk_B\ln V+\text{cste}
Second principe :: \Delta S_{univers}\ge0
Joule–Gay-Lussac :: \Delta S=Nk_B\ln\frac{V_f}{V_i}
Identité thermodynamique :: dU=T\,dS-P\,dV
Énergie libre :: F=U-TS,\qquad dF=-S\,dT-P\,dV
Enthalpie libre :: G=U-TS+PV,\qquad dG=-S\,dT+V\,dP
Relation de Maxwell :: \left(\frac{\partial S}{\partial V}\right)_T=\left(\frac{\partial P}{\partial T}\right)_V

@pitfalls
- $dS = \delta Q/T$ ne vaut que pour un chemin **réversible**. Sinon $dS>\delta Q/T$.
- L'entropie d'un système peut diminuer (un liquide qui gèle) ; c'est celle de l'**univers** (système + extérieur) qui ne diminue jamais.
- Adiabatique ne veut pas dire isentropique : il faut en plus la réversibilité.

@cards
Définition de l'entropie ? :: $dS = \delta Q_{rév}/T$
Énoncé du second principe ? :: L'entropie d'un système isolé ne peut qu'augmenter : $\Delta S\ge0$, avec égalité si la transformation est réversible.
Entropie d'un gaz parfait ? :: $S = C_V\ln T+Nk_B\ln V+$ cste
Identité thermodynamique ? :: $dU = T\,dS-P\,dV$
Énergie libre $F$ et sa différentielle ? :: $F = U-TS$, $dF = -S\,dT-P\,dV$
Enthalpie libre $G$ et sa différentielle ? :: $G = U-TS+PV$, $dG = -S\,dT+V\,dP$
Comment calculer $\Delta S$ pour une transformation irréversible ? :: En imaginant un chemin réversible entre les mêmes états ($S$ est une fonction d'état).
D'où viennent les relations de Maxwell ? :: De l'égalité des dérivées croisées d'un potentiel thermodynamique.
Quel potentiel est minimal à l'équilibre à $T$ et $P$ fixés ? :: L'enthalpie libre $G$.
$\Delta S$ dans la détente de Joule–Gay-Lussac ? :: $Nk_B\ln(V_f/V_i)>0$

@quiz
? Pour une transformation irréversible d'un système isolé, l'entropie
+ augmente strictement
- reste constante
- diminue
- peut augmenter ou diminuer
= Second principe : $\Delta S>0$ si irréversible, $= 0$ si réversible.
? Un gaz parfait double de volume par détente de Joule–Gay-Lussac. Sa variation d'entropie est
+ $Nk_B\ln2$
- $0$ car $Q = 0$
- $-Nk_B\ln2$
- $2Nk_B$
= On calcule le long d'un chemin réversible (isotherme) entre les mêmes états.
? La différentielle de l'énergie libre $F = U-TS$ est
+ $dF = -S\,dT-P\,dV$
- $dF = T\,dS-P\,dV$
- $dF = -S\,dT+V\,dP$
- $dF = T\,dS+V\,dP$
= $dF = dU-T\,dS-S\,dT$ avec $dU = T\,dS-P\,dV$.
? À partir de $dU = T\,dS-P\,dV$, la température s'obtient par
+ $T = \left(\frac{\partial U}{\partial S}\right)_V$
- $T = \left(\frac{\partial U}{\partial V}\right)_S$
- $T = -\left(\frac{\partial U}{\partial S}\right)_V$
- $T = \left(\frac{\partial S}{\partial U}\right)_V$
= On lit le coefficient de $dS$.
? L'entropie d'un système (non isolé) peut-elle diminuer ?
+ Oui, si l'entropie de l'extérieur augmente au moins autant
- Non, jamais
- Oui, sans aucune condition
- Seulement à température nulle
= C'est l'entropie totale (système + extérieur) qui ne peut pas diminuer.
? Pourquoi introduit-on le facteur $1/T$ devant $\delta Q$ ?
+ Parce que $\delta Q_{rév}/T$ est une différentielle exacte
- Pour avoir les bonnes unités
- Parce que $Q$ est proportionnelle à $T$
- Par convention historique
= $1/T$ est un facteur intégrant qui transforme $\delta Q$ en la différentielle d'une fonction d'état.
? Un solide chaud est plongé dans un grand bain froid. L'entropie du solide
+ diminue, mais celle du bain augmente davantage
- augmente
- ne change pas
- diminue, et celle de l'univers aussi
= $\Delta S_{solide} = C\ln(T_0/T_1)<0$, mais $\Delta S_{total}>0$.
? Les variables naturelles de l'enthalpie libre $G$ sont
+ $T$ et $P$
- $S$ et $V$
- $T$ et $V$
- $S$ et $P$
= $dG = -S\,dT+V\,dP$ : c'est le potentiel adapté aux expériences à température et pression fixées.

@chapter machines | 5. Machines thermiques
@intro Une machine thermique fait décrire des cycles à un fluide pour convertir de la chaleur en travail (moteur) ou l'inverse (réfrigérateur, pompe à chaleur). Le second principe limite leur rendement.

@section Cycles et moteurs
- Sur un **cycle**, le fluide revient à son état initial : $\Delta U = 0$ ⟹ $W+\sum Q_i = 0$, et $\Delta S_{fluide} = 0$.
- **Moteur** : il fournit du travail, $W<0$. Dans le diagramme $(P,V)$, le cycle est parcouru dans le sens **horaire** et $|W|$ = **aire du cycle**.
- **Rendement** : $\eta = \dfrac{\text{ce qu'on récupère}}{\text{ce qu'on paie}} = \dfrac{-W}{Q_c}$ ($Q_c$ = chaleur reçue de la source chaude).

@section Inégalité de Clausius
> Pour un cycle échangeant $Q_i$ avec des sources à $T_i$ : $\displaystyle\sum_i\frac{Q_i}{T_i}\le0$ (égalité si réversible).
- **Une seule source** : $Q/T\le0$ ⟹ $Q\le0$ ⟹ $W\ge0$. **Impossible de faire un moteur avec une seule source** (énoncé de Kelvin).
- **Deux sources** ($T_c>T_f$) : un moteur prend $Q_c>0$ à la source chaude, rejette $Q_f<0$ à la source froide et fournit $-W = Q_c+Q_f$.
> **Rendement maximal (Carnot)** : $\eta\le1-\dfrac{T_f}{T_c}$, atteint seulement pour un cycle réversible.

@section Le cycle de Carnot
- Quatre étapes réversibles : (1) détente **isotherme** à $T_c$ (reçoit $Q_c$) ; (2) détente **adiabatique** ($T_c\to T_f$) ; (3) compression **isotherme** à $T_f$ (cède $|Q_f|$) ; (4) compression **adiabatique** ($T_f\to T_c$).
- $\dfrac{Q_c}{T_c}+\dfrac{Q_f}{T_f} = 0$ ⟹ $\eta_{Carnot} = 1-\dfrac{T_f}{T_c}$, indépendant du fluide.
{{viz:carnot}}

@section Réfrigérateurs et pompes à chaleur
- On parcourt le cycle à l'envers : on **fournit** du travail ($W>0$) pour faire passer de la chaleur du froid vers le chaud.
- **Réfrigérateur / climatiseur** : on veut $Q_f$ (chaleur prise au froid). Efficacité $e = \dfrac{Q_f}{W}\le\dfrac{T_f}{T_c-T_f}$.
- **Pompe à chaleur** : on veut $-Q_c$ (chaleur donnée au chaud). Efficacité $e = \dfrac{-Q_c}{W}\le\dfrac{T_c}{T_c-T_f}$, toujours $>1$ : on récupère plus de chaleur que le travail dépensé.

@formulas
Bilan sur un cycle :: W+Q_c+Q_f=0
Rendement d'un moteur :: \eta=\frac{-W}{Q_c}=1+\frac{Q_f}{Q_c}
Inégalité de Clausius :: \sum_i\frac{Q_i}{T_i}\le0
Rendement de Carnot :: \eta_{max}=1-\frac{T_f}{T_c}
Réfrigérateur :: e=\frac{Q_f}{W}\le\frac{T_f}{T_c-T_f}
Pompe à chaleur :: e=\frac{-Q_c}{W}\le\frac{T_c}{T_c-T_f}

@pitfalls
- Les températures du rendement de Carnot sont en **kelvins**.
- Attention aux signes : pour un moteur, $W<0$, $Q_c>0$, $Q_f<0$.
- Le rendement de Carnot est une borne supérieure : un moteur réel (irréversible) fait toujours moins bien.
- L'efficacité d'une pompe à chaleur dépasse 1 sans violer le premier principe : la chaleur vient de la source froide.

@cards
Rendement d'un moteur thermique ? :: $\eta = -W/Q_c$
Rendement maximal entre deux sources ? :: $\eta_{Carnot} = 1-T_f/T_c$
Inégalité de Clausius ? :: $\sum_iQ_i/T_i\le0$ sur un cycle, égalité si réversible.
Les quatre étapes du cycle de Carnot ? :: Deux isothermes (à $T_c$ et $T_f$) reliées par deux adiabatiques, toutes réversibles.
Peut-on faire un moteur avec une seule source de chaleur ? :: Non (énoncé de Kelvin du second principe).
Efficacité maximale d'un réfrigérateur ? :: $T_f/(T_c-T_f)$
Efficacité maximale d'une pompe à chaleur ? :: $T_c/(T_c-T_f)$
Que représente l'aire d'un cycle dans le diagramme $(P,V)$ ? :: Le travail échangé au cours du cycle.
Sens de parcours d'un cycle moteur dans le diagramme $(P,V)$ ? :: Sens horaire.

@quiz
? Le rendement maximal d'un moteur fonctionnant entre 300 K et 600 K est
+ 50 %
- 100 %
- 25 %
- 200 %
= $1-300/600 = 0{,}5$.
? Un moteur cyclique en contact avec une seule source de chaleur
+ ne peut pas fournir de travail
- a un rendement de 100 %
- a le rendement de Carnot
- fonctionne si la source est assez chaude
= Clausius : $Q/T\le0$ donc $W = -Q\ge0$ : le système ne peut que recevoir du travail.
? Le cycle de Carnot est constitué de
+ deux isothermes et deux adiabatiques
- deux isothermes et deux isochores
- deux isobares et deux adiabatiques
- quatre isothermes
= Les échanges de chaleur se font uniquement sur les isothermes, à la température des sources.
? Sur un cycle moteur, le travail fourni est égal à
+ $Q_c+Q_f$ (avec $Q_f<0$)
- $Q_c$
- $Q_c-|W|$
- $Q_f$
= Premier principe sur un cycle : $-W = Q_c+Q_f = Q_c-|Q_f|$.
? Une pompe à chaleur idéale fonctionne entre 280 K (extérieur) et 300 K (maison). Son efficacité maximale est
+ 15
- 1
- 0,07
- 14
= $T_c/(T_c-T_f) = 300/20 = 15$.
? Pour un cycle **réversible** entre deux sources, on a
+ $\dfrac{Q_c}{T_c}+\dfrac{Q_f}{T_f} = 0$
- $\dfrac{Q_c}{T_c}+\dfrac{Q_f}{T_f}<0$
- $Q_c+Q_f = 0$
- $Q_cT_c+Q_fT_f = 0$
= Cas d'égalité de l'inégalité de Clausius.
? Pour augmenter le rendement de Carnot, on peut
+ augmenter $T_c$ ou diminuer $T_f$
- diminuer $T_c$
- augmenter $T_f$
- changer de gaz
= $\eta = 1-T_f/T_c$ ne dépend que des températures des sources.

@chapter chimique | 6. Potentiels chimiques
@intro Quand le nombre de particules peut varier (système ouvert, mélange, réaction chimique), une nouvelle variable intensive apparaît : le potentiel chimique $\mu$, qui joue pour les particules le rôle que la température joue pour la chaleur.

@section Systèmes ouverts
> $dU = T\,dS-P\,dV+\mu\,dN$, avec $\mu = \left(\dfrac{\partial U}{\partial N}\right)_{S,V}$ : énergie nécessaire pour ajouter une particule.
- De même : $dF = -S\,dT-P\,dV+\mu\,dN$ et $dG = -S\,dT+V\,dP+\mu\,dN$, donc $\mu = \left(\dfrac{\partial G}{\partial N}\right)_{T,P}$.
- Plusieurs espèces : $\sum_i\mu_i\,dN_i$.

@section Relations utiles
- Extensivité ⟹ $U = TS-PV+\mu N$, d'où $G = \mu N$ : **le potentiel chimique est l'enthalpie libre par particule**.
> **Gibbs–Duhem** : $S\,dT-V\,dP+N\,d\mu = 0$ — les trois variables intensives $T$, $P$, $\mu$ ne sont pas indépendantes.
- **Grand potentiel** : $\Omega = F-\mu N = -PV$, variables naturelles $(T,V,\mu)$.

@section Applications
- **Gaz parfait** : $\mu(T,P) = \mu_0(T)+k_BT\ln\dfrac{P}{P_0}$ — $\mu$ croît avec la pression.
- **Phases condensées** (liquide, solide) : $\mu$ dépend très peu de la pression.
> **Condition d'équilibre** : deux systèmes qui échangent des particules sont à l'équilibre quand $\mu_1 = \mu_2$. Hors équilibre, les particules vont du **grand $\mu$ vers le petit $\mu$**.
- Équilibre complet entre deux systèmes : $T_1 = T_2$ (thermique), $P_1 = P_2$ (mécanique), $\mu_1 = \mu_2$ (échange de particules).
- **Mélanges et solutions idéales** : $\mu_i = \mu_i^0+k_BT\ln x_i$ ($x_i$ = fraction molaire). Mélanger abaisse $\mu$ ⟹ pression osmotique, abaissement du point de congélation.
- **Chimie** : pour une réaction $\sum_i\nu_iA_i = 0$, l'équilibre est $\sum_i\nu_i\mu_i = 0$ ⟹ loi d'action de masse.

@formulas
Identité avec N variable :: dU=T\,dS-P\,dV+\mu\,dN
Potentiel chimique :: \mu=\left(\frac{\partial U}{\partial N}\right)_{S,V}=\left(\frac{\partial G}{\partial N}\right)_{T,P}
Relation d'Euler :: U=TS-PV+\mu N,\qquad G=\mu N
Gibbs–Duhem :: S\,dT-V\,dP+N\,d\mu=0
Grand potentiel :: \Omega=F-\mu N=-PV
Gaz parfait :: \mu=\mu_0(T)+k_BT\ln\frac{P}{P_0}
Solution idéale :: \mu_i=\mu_i^0+k_BT\ln x_i
Équilibre chimique :: \sum_i\nu_i\,\mu_i=0

@pitfalls
- Les particules vont vers le potentiel chimique le plus **bas** (comme la chaleur va vers la température la plus basse).
- $G = \mu N$ n'est vrai tel quel que pour un corps pur ; pour un mélange $G = \sum_i\mu_iN_i$.
- $T$, $P$, $\mu$ ne peuvent pas varier indépendamment (Gibbs–Duhem).

@cards
Définition du potentiel chimique ? :: $\mu = (\partial U/\partial N)_{S,V} = (\partial G/\partial N)_{T,P}$
Identité thermodynamique pour un système ouvert ? :: $dU = T\,dS-P\,dV+\mu\,dN$
Relation de Gibbs–Duhem ? :: $S\,dT-V\,dP+N\,d\mu = 0$
Lien entre $G$ et $\mu$ pour un corps pur ? :: $G = \mu N$
Condition d'équilibre pour l'échange de particules ? :: Égalité des potentiels chimiques : $\mu_1 = \mu_2$.
Dans quel sens vont les particules hors équilibre ? :: Du potentiel chimique le plus élevé vers le plus bas.
Potentiel chimique d'un gaz parfait ? :: $\mu = \mu_0(T)+k_BT\ln(P/P_0)$
Grand potentiel ? :: $\Omega = F-\mu N = -PV$
Condition d'équilibre chimique ? :: $\sum_i\nu_i\mu_i = 0$

@quiz
? Deux systèmes peuvent échanger des particules. À l'équilibre, ils ont le même
+ potentiel chimique
- nombre de particules
- volume
- énergie interne
= Comme l'égalité des températures pour l'échange de chaleur.
? Pour un corps pur, l'enthalpie libre $G$ est égale à
+ $\mu N$
- $-PV$
- $TS$
- $U-\mu N$
= Par extensivité : $U = TS-PV+\mu N$, donc $G = U-TS+PV = \mu N$.
? La relation de Gibbs–Duhem exprime que
+ $T$, $P$ et $\mu$ ne sont pas indépendantes
- l'énergie est conservée
- l'entropie augmente
- $N$ est constant
= $S\,dT-V\,dP+N\,d\mu = 0$ relie les variations des trois variables intensives.
? Si $\mu_1>\mu_2$, les particules passent spontanément
+ du système 1 vers le système 2
- du système 2 vers le système 1
- dans les deux sens de manière égale
- nulle part
= Vers le potentiel chimique le plus bas, ce qui fait diminuer l'enthalpie libre totale.
? Quand on augmente la pression d'un gaz parfait à $T$ fixée, son potentiel chimique
+ augmente
- diminue
- ne change pas
- devient nul
= $\mu = \mu_0(T)+k_BT\ln(P/P_0)$.
? Le terme $\mu\,dN$ dans $dU$ représente
+ l'énergie apportée par l'ajout de particules
- le travail des forces de pression
- la chaleur reçue
- l'énergie cinétique du centre de masse
= $\mu$ est l'énergie qu'il faut pour ajouter une particule à $S$ et $V$ fixés.
? Le grand potentiel $\Omega = F-\mu N$ vaut aussi
+ $-PV$
- $\mu N$
- $TS$
- $PV$
= $F = U-TS = -PV+\mu N$ par la relation d'Euler.

@chapter corpspur | 7. Équilibre du corps pur
@intro Un corps pur peut exister sous plusieurs phases (solide, liquide, gaz). Ce chapitre décrit les transitions de phase, la chaleur latente et le diagramme de phase.

@section Faits expérimentaux
- **Phases** : solide, liquide, gaz (et d'autres : phases magnétiques, supraconductrices…).
- Transitions : fusion/solidification, vaporisation/condensation, sublimation/condensation solide.
- À pression donnée, la transition se produit à une **température précise** $T_c$ (ex. eau : 0 °C et 100 °C à 1 atm).

@section Classification d'Ehrenfest
- On regarde l'enthalpie libre $G(T,P)$, qui est toujours **continue** à la transition.
> **Premier ordre** : les dérivées **premières** de $G$ sont discontinues — l'entropie $S = -\left(\frac{\partial G}{\partial T}\right)_P$ et le volume $V = \left(\frac{\partial G}{\partial P}\right)_T$ sautent. ⟹ chaleur latente, coexistence de phases.
- **Second ordre** : dérivées premières continues, dérivées **secondes** discontinues (ex. capacité calorifique). Pas de chaleur latente.

@section Chaleur latente
- Pendant une transition du premier ordre, la température **reste bloquée** à $T_c$ tant que les deux phases coexistent : la chaleur fournie sert à transformer une phase en l'autre.
> **Chaleur latente** $L$ : chaleur nécessaire pour faire passer tout le système d'une phase à l'autre. $L = T_c\,\Delta S$. Extensive ; restituée intégralement lors de la transition inverse.
- Eau : $L_{fusion} = 334$ kJ/kg, $L_{vaporisation} = 2265$ kJ/kg — vaporiser 1 kg d'eau à 100 °C demande bien plus que de la chauffer de 20 à 100 °C (≈ 335 kJ).
- C'est ce plateau qui maintient l'eau bouillante à température constante.
{{viz:phases}}

@section Diagramme de phase (T, P)
- Trois régions (solide, liquide, gaz) séparées par des **lignes de coexistence** : fusion, vaporisation, sublimation. Sur une ligne : $\mu_1(T,P) = \mu_2(T,P)$.
- **Point triple** : les trois phases coexistent (une seule valeur de $T$ et $P$ ; eau : 273,16 K, 611 Pa).
- **Point critique** $C$ : fin de la ligne de vaporisation. Au-delà, plus de distinction liquide/gaz : on passe continûment de l'un à l'autre.

@formulas
Dérivées de G :: S=-\left(\frac{\partial G}{\partial T}\right)_P,\qquad V=\left(\frac{\partial G}{\partial P}\right)_T
Chaleur latente :: L=T_c\,\Delta S=T_c\,(S_2-S_1)
Coexistence de deux phases :: \mu_1(T,P)=\mu_2(T,P)
Chauffage sans transition :: Q=m\,c\,\Delta T
Changement d'état :: Q=m\,\ell\quad(\ell=\text{chaleur latente massique})

@pitfalls
- Pendant un changement d'état, fournir de la chaleur ne fait **pas** monter la température.
- À la transition, $G$ est continue : ce sont ses dérivées qui sautent.
- Au-delà du point critique, il n'y a plus de transition liquide–gaz.

@cards
Qu'est-ce qu'une transition du premier ordre (Ehrenfest) ? :: Une transition où les dérivées premières de $G$ ($S$ et $V$) sont discontinues ; il y a une chaleur latente.
Qu'est-ce qu'une transition du second ordre ? :: Dérivées premières de $G$ continues, dérivées secondes discontinues ; pas de chaleur latente.
Définition de la chaleur latente ? :: Chaleur à fournir pour transformer entièrement une phase en l'autre à $T_c$ : $L = T_c\Delta S$.
Que fait la température pendant un changement d'état ? :: Elle reste constante (plateau) tant que les deux phases coexistent.
Qu'est-ce que le point triple ? :: Le point unique $(T,P)$ où solide, liquide et gaz coexistent.
Qu'est-ce que le point critique ? :: La fin de la ligne de vaporisation ; au-delà, liquide et gaz ne se distinguent plus.
Condition de coexistence de deux phases ? :: Égalité des potentiels chimiques : $\mu_1(T,P) = \mu_2(T,P)$.
Chaleur latente de vaporisation de l'eau ? :: Environ 2265 kJ/kg.

@quiz
? Pendant l'ébullition de l'eau à pression constante, sa température
+ reste constante
- augmente régulièrement
- diminue
- oscille
= La chaleur fournie sert à vaporiser le liquide (chaleur latente), pas à l'échauffer.
? Lors d'une transition du premier ordre, quelle grandeur est discontinue ?
+ L'entropie
- L'enthalpie libre $G$
- La température
- La pression
= Les dérivées premières de $G$ ($S$ et $V$) sautent ; $G$ elle-même est continue.
? Au point triple d'un corps pur,
+ les trois phases coexistent
- seuls le liquide et le gaz coexistent
- liquide et gaz ne se distinguent plus
- le corps est forcément solide
= Il n'existe qu'un seul couple $(T,P)$ où cela se produit.
? Au-delà du point critique,
+ on passe continûment du liquide au gaz, sans transition
- le corps est solide
- les trois phases coexistent
- la chaleur latente est maximale
= La ligne de vaporisation s'arrête au point critique.
? La chaleur latente d'une transition à la température $T_c$ est reliée au saut d'entropie par
+ $L = T_c\,\Delta S$
- $L = \Delta S/T_c$
- $L = \Delta S$
- $L = T_c^2\,\Delta S$
= Transformation réversible à température constante : $Q = T\Delta S$.
? Quelle énergie faut-il pour vaporiser 2 kg d'eau déjà à 100 °C ($\ell_v = 2265$ kJ/kg) ?
+ 4530 kJ
- 2265 kJ
- 1132 kJ
- 668 kJ
= La chaleur latente est extensive : $2\times2265$ kJ.
? Une transition du second ordre se distingue par
+ l'absence de chaleur latente
- une chaleur latente très grande
- un saut de volume
- la coexistence de deux phases
= Les dérivées premières de $G$ (dont $S$) sont continues ; seules les dérivées secondes sautent.
`);
