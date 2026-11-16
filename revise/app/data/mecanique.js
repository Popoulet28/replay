addCourse({ id: 'mecanique', title: 'Mécanique I', sub: 'P. Paruch & C. Renner — du point matériel aux fluides', color: '#2f7de0', icon: '⚙' }, String.raw`
@chapter mouvement | 1. Description du mouvement
@intro L'état d'une particule est donné par sa position $\vec q$ et sa quantité de mouvement $\vec p$. Les lois de Newton disent comment cet état évolue. On les applique à la chute libre, au projectile et à l'oscillateur harmonique.

@section Référentiel, état, unités
- Un **référentiel inertiel** (de Galilée) : sans forces fictives ; un objet libre y va en ligne droite à vitesse constante. Tout référentiel en translation rectiligne uniforme par rapport à lui est aussi inertiel.
- **État** d'une particule : position $\vec q(t)$ et **quantité de mouvement** $\vec p = m\dot{\vec q}$. L'ensemble des états $(\vec q,\vec p)$ est l'**espace de phase**.
- Vitesse $\vec v = \dot{\vec q}$, accélération $\vec a = \ddot{\vec q}$.
- Unités SI : mètre, kilogramme, seconde. Toujours vérifier les dimensions d'un résultat.

@section Coordonnées polaires
- $\vec q = r\,\hat e_r$ ; les vecteurs $\hat e_r,\hat e_\theta$ **tournent** avec la particule : $\dot{\hat e}_r = \dot\theta\,\hat e_\theta$, $\dot{\hat e}_\theta = -\dot\theta\,\hat e_r$.
- Vitesse : $\vec v = \dot r\,\hat e_r+r\dot\theta\,\hat e_\theta$.
- Accélération : $\vec a = (\ddot r-r\dot\theta^2)\,\hat e_r+(r\ddot\theta+2\dot r\dot\theta)\,\hat e_\theta$.
- Mouvement circulaire uniforme : accélération **centripète** $a = r\dot\theta^2 = v^2/r$, dirigée vers le centre.

@section Lois de Newton
> **1re loi (inertie)** : sans force, $\vec p$ est constant. **2e loi** : $\vec F = \dot{\vec p} = m\ddot{\vec q}$. **3e loi** : action = −réaction, $\vec F_{12} = -\vec F_{21}$.
- Forces usuelles : poids $m\vec g$, ressort $-kq$ (Hooke), frottement fluide $-b\vec v$, gravitation $-\dfrac{GMm}{r^2}\hat e_r$.
- **Équilibre** : $\sum\vec F = 0$. Stable si une petite perturbation ramène au point d'équilibre.
- Méthode : (1) choisir le référentiel et les axes, (2) bilan des forces, (3) $m\ddot{\vec q} = \sum\vec F$, (4) intégrer avec les conditions initiales $q(0)$, $\dot q(0)$.

@section Chute libre et projectile
- Sans frottement : $\ddot z = -g$ ⟹ $z(t) = z_0+v_0t-\tfrac12gt^2$.
- Projectile : mouvement horizontal uniforme + chute libre verticale ⟹ trajectoire **parabolique**. Portée $\dfrac{v_0^2\sin2\alpha}{g}$, maximale pour $\alpha = 45°$.
- Avec frottement $-b\vec v$ : $m\dot v = mg-bv$ ⟹ $v(t) = v_\infty(1-e^{-t/\tau})$, **vitesse limite** $v_\infty = mg/b$, temps caractéristique $\tau = m/b$.
- Projectile et cible tombante : si on vise la cible et qu'elle tombe au moment du tir, on la touche toujours (les deux « tombent » de $\tfrac12gt^2$).
{{viz:projectile}}

@section Oscillateur harmonique simple
- Ressort : $m\ddot q = -kq$ ⟹ $\ddot q+\omega_0^2q = 0$ avec $\omega_0 = \sqrt{k/m}$.
> Solution : $q(t) = A\cos(\omega_0t+\varphi)$. Période $T_0 = 2\pi/\omega_0$, **indépendante de l'amplitude**.
- $A$ et $\varphi$ sont fixés par les conditions initiales.
- Énergie $E = \tfrac12m\dot q^2+\tfrac12kq^2 = \tfrac12kA^2$ : constante. Dans l'espace de phase, la trajectoire est une **ellipse**.
- Équations différentielles linéaires : on cherche $q = Ae^{\gamma t}$ ; solution générale = combinaison linéaire des solutions (principe de **superposition**) ; avec second membre : solution homogène + solution particulière.
- **Intégration numérique** (Euler) : $q_{n+1} = q_n+\dot q_n\,\Delta t$, $p_{n+1} = p_n+F_n\,\Delta t$ ; l'erreur diminue avec le pas $\Delta t$.

@formulas
2e loi de Newton :: \vec F=\dot{\vec p}=m\ddot{\vec q}
Vitesse en polaires :: \vec v=\dot r\,\hat e_r+r\dot\theta\,\hat e_\theta
Accélération en polaires :: \vec a=(\ddot r-r\dot\theta^2)\hat e_r+(r\ddot\theta+2\dot r\dot\theta)\hat e_\theta
Chute libre :: z(t)=z_0+v_0t-\tfrac12gt^2
Vitesse limite :: v_\infty=\frac{mg}{b},\qquad v(t)=v_\infty\left(1-e^{-bt/m}\right)
Portée :: x_{max}=\frac{v_0^2\sin 2\alpha}{g}
Oscillateur harmonique :: \ddot q+\omega_0^2q=0,\quad q=A\cos(\omega_0t+\varphi),\quad \omega_0=\sqrt{k/m}
Période :: T_0=\frac{2\pi}{\omega_0}=2\pi\sqrt{\frac mk}

@pitfalls
- En polaires, ne pas oublier les termes $-r\dot\theta^2$ (centripète) et $2\dot r\dot\theta$ : les vecteurs de base dépendent du temps.
- La période d'un oscillateur harmonique ne dépend pas de l'amplitude.
- La 3e loi concerne deux forces agissant sur deux corps **différents** : elles ne se compensent pas sur un même corps.

@cards
Qu'est-ce qui définit l'état d'une particule ? :: Sa position $\vec q$ et sa quantité de mouvement $\vec p$ (un point de l'espace de phase).
2e loi de Newton ? :: $\vec F = \dot{\vec p} = m\ddot{\vec q}$
Vitesse en coordonnées polaires ? :: $\vec v = \dot r\hat e_r+r\dot\theta\hat e_\theta$
Accélération centripète d'un mouvement circulaire ? :: $v^2/r = r\dot\theta^2$, dirigée vers le centre.
Vitesse limite avec frottement $-bv$ ? :: $v_\infty = mg/b$
Pulsation propre d'un système masse–ressort ? :: $\omega_0 = \sqrt{k/m}$
Solution générale de $\ddot q+\omega_0^2q=0$ ? :: $q(t) = A\cos(\omega_0t+\varphi)$
Qu'est-ce qu'un référentiel inertiel ? :: Un référentiel où un corps sans force a un mouvement rectiligne uniforme (pas de forces fictives).
Angle de tir donnant la portée maximale (sans frottement) ? :: $45°$

@quiz
? La période d'un oscillateur masse–ressort dépend de
+ la masse et la constante du ressort
- l'amplitude
- la vitesse initiale
- la masse, la raideur et l'amplitude
= $T_0 = 2\pi\sqrt{m/k}$ : aucune dépendance en l'amplitude.
? Une bille tombe dans un fluide avec frottement $-bv$. Sa vitesse limite est
+ $mg/b$
- $b/mg$
- $\sqrt{mg/b}$
- infinie
= À la vitesse limite, le poids $mg$ équilibre le frottement $bv$.
? En coordonnées polaires, la composante radiale de l'accélération est
+ $\ddot r-r\dot\theta^2$
- $\ddot r$
- $\ddot r+r\dot\theta^2$
- $r\ddot\theta+2\dot r\dot\theta$
= Le terme $-r\dot\theta^2$ est l'accélération centripète.
? Dans l'espace de phase $(q,p)$, la trajectoire d'un oscillateur harmonique est
+ une ellipse
- une droite
- une parabole
- une spirale
= $E = p^2/2m+kq^2/2$ constant est l'équation d'une ellipse. (La spirale, c'est avec amortissement.)
? Sans frottement, la portée d'un projectile est maximale pour un angle de
+ 45°
- 30°
- 60°
- 90°
= La portée vaut $v_0^2\sin(2\alpha)/g$, maximale quand $2\alpha = 90°$.
? D'après la 1re loi de Newton, un corps soumis à aucune force
+ garde une quantité de mouvement constante
- finit par s'arrêter
- accélère
- est forcément immobile
= Mouvement rectiligne uniforme (ou repos) dans un référentiel inertiel.
? On tire en visant directement une cible qui commence à tomber à l'instant du tir. Le projectile
+ touche la cible
- passe au-dessus
- passe en dessous
- cela dépend de la vitesse du projectile
= Projectile et cible s'écartent tous deux de la ligne de visée de $\frac12gt^2$.

@chapter energie | 2. Énergie et systèmes hamiltoniens
@intro Quand les forces dérivent d'un potentiel, l'énergie mécanique est conservée. Cela permet d'analyser un mouvement **qualitativement**, sans résoudre les équations.

@section Énergie mécanique et Hamiltonien
- Énergie cinétique $T = \dfrac{p^2}{2m} = \tfrac12mv^2$, énergie potentielle $V(q)$.
> **Hamiltonien** : $H(p,q) = \dfrac{p^2}{2m}+V(q)$. Dans un système hamiltonien (conservatif), $H = E$ est **constante** le long du mouvement.
- Équations de Hamilton : $\dot q = \dfrac{\partial H}{\partial p}$, $\dot p = -\dfrac{\partial H}{\partial q}$.

@section Travail et potentiel
- **Travail** : $W = \displaystyle\int_\Gamma\vec F\cdot d\vec q$. Théorème de l'énergie cinétique : $W = \Delta T$.
- Force **conservative** : le travail ne dépend pas du chemin ⟺ $\vec F = -\nabla V$ ⟺ $\nabla\times\vec F = 0$ (via le **théorème de Stokes** : $\oint\vec F\cdot d\vec q = \iint(\nabla\times\vec F)\cdot d\vec S$).
- Alors $W_{A\to B} = V(A)-V(B)$ et $T+V$ est conservée.
- Le frottement n'est pas conservatif : il dissipe l'énergie.

@section Gravitation
- Force : $\vec F = -\dfrac{GMm}{r^2}\hat e_r$. Énergie potentielle : $V(r) = -\dfrac{GMm}{r}$ (nulle à l'infini).
- Champ gravitationnel $\vec g = \vec F/m$, potentiel $\phi = V/m$.
- Près du sol : $V\approx mgh$ avec $g = GM/R^2$.
> **Vitesse de libération** : $E = 0$ ⟹ $v_{lib} = \sqrt{2GM/R} = \sqrt{2gR}\approx11{,}2$ km/s pour la Terre.

@section Analyse qualitative
- Comme $T\ge0$ : le mouvement n'est possible que là où $V(q)\le E$.
- **Points de rebroussement** : $V(q) = E$ (vitesse nulle, la particule fait demi-tour).
- **Équilibres** : $V'(q) = 0$ ; stable si minimum de $V$ ($V''>0$), instable si maximum.
- Près d'un minimum : $V\approx V_0+\tfrac12V''(q_0)(q-q_0)^2$ ⟹ petites oscillations harmoniques, $\omega = \sqrt{V''(q_0)/m}$.
{{viz:potentiel}}

@section Pendule rigide
- $V(\theta) = -mgl\cos\theta$, $E = \tfrac12ml^2\dot\theta^2-mgl\cos\theta$.
- $E<mgl$ : **libration** (oscillations) entre $\pm\theta_{max}$. Petits angles : $\omega_0 = \sqrt{g/l}$.
- $E>mgl$ : **rotation** (le pendule fait des tours complets).
- $E = mgl$ : **séparatrice** entre les deux régimes (temps infini pour atteindre le sommet).

@formulas
Hamiltonien :: H(p,q)=\frac{p^2}{2m}+V(q)
Équations de Hamilton :: \dot q=\frac{\partial H}{\partial p},\qquad \dot p=-\frac{\partial H}{\partial q}
Travail :: W=\int_\Gamma\vec F\cdot d\vec q=\Delta T
Force conservative :: \vec F=-\nabla V\iff\nabla\times\vec F=0
Énergie potentielle gravitationnelle :: V(r)=-\frac{GMm}{r}
Vitesse de libération :: v_{lib}=\sqrt{\frac{2GM}{R}}
Petites oscillations :: \omega=\sqrt{\frac{V''(q_0)}{m}}
Pendule :: E=\tfrac12ml^2\dot\theta^2-mgl\cos\theta,\qquad \omega_0=\sqrt{g/l}

@pitfalls
- Signe : $\vec F = -\nabla V$. La force pousse vers les **basses** énergies potentielles.
- L'énergie potentielle gravitationnelle $-GMm/r$ est négative ; $mgh$ n'est qu'une approximation près du sol.
- La période du pendule ne vaut $2\pi\sqrt{l/g}$ que pour les petits angles.

@cards
Hamiltonien d'une particule dans un potentiel ? :: $H = \dfrac{p^2}{2m}+V(q)$
Équations de Hamilton ? :: $\dot q = \partial H/\partial p$, $\dot p = -\partial H/\partial q$
Critère pour qu'une force soit conservative ? :: $\nabla\times\vec F = 0$, ou de façon équivalente $\vec F = -\nabla V$.
Vitesse de libération ? :: $\sqrt{2GM/R}$ (≈ 11,2 km/s pour la Terre).
Où le mouvement est-il permis à énergie $E$ ? :: Là où $V(q)\le E$.
Qu'est-ce qu'un point de rebroussement ? :: Un point où $V(q) = E$ : la vitesse s'annule et la particule repart.
Condition d'équilibre stable ? :: Minimum de $V$ : $V' = 0$ et $V''>0$.
Les deux régimes du pendule rigide ? :: Libration ($E<mgl$) et rotation ($E>mgl$), séparés par la séparatrice.
Théorème de l'énergie cinétique ? :: Le travail total des forces égale la variation d'énergie cinétique : $W = \Delta T$.

@quiz
? Une force est conservative si et seulement si
+ son rotationnel est nul
- sa divergence est nulle
- elle est constante
- elle est perpendiculaire à la vitesse
= $\nabla\times\vec F = 0$ ⟺ $\vec F = -\nabla V$ ⟺ travail indépendant du chemin.
? Une particule d'énergie $E$ dans un potentiel $V(q)$ peut se trouver
+ là où $V(q)\le E$
- là où $V(q)\ge E$
- partout
- seulement aux minima de $V$
= L'énergie cinétique $E-V(q)$ ne peut pas être négative.
? Un équilibre est stable lorsque le potentiel y présente
+ un minimum
- un maximum
- un point d'inflexion
- une valeur nulle
= La force $-V'$ ramène alors vers le point d'équilibre.
? La vitesse de libération de la Terre vaut environ
+ 11,2 km/s
- 7,9 km/s
- 1,1 km/s
- 300 000 km/s
= $\sqrt{2gR}$ avec $R\approx6400$ km. (7,9 km/s est la vitesse d'orbite basse.)
? Pour un pendule rigide d'énergie $E>mgl$ (avec $V = -mgl\cos\theta$), le mouvement est
+ une rotation complète
- une oscillation autour de $\theta = 0$
- un équilibre
- impossible
= L'énergie dépasse le maximum du potentiel : le pendule passe par-dessus le sommet.
? L'énergie potentielle gravitationnelle d'une masse $m$ à distance $r$ d'une masse $M$ est
+ $-GMm/r$
- $+GMm/r$
- $-GMm/r^2$
- $mgr$
= Elle est négative et tend vers 0 à l'infini ; la force est $-dV/dr = -GMm/r^2$.
? Le travail d'une force conservative le long d'un chemin fermé vaut
+ zéro
- $2\pi$ fois l'énergie
- l'énergie cinétique
- cela dépend du chemin
= Par Stokes, $\oint\vec F\cdot d\vec q = \iint(\nabla\times\vec F)\cdot d\vec S = 0$.

@chapter nparticules | 3. Systèmes à N particules
@intro Pour plusieurs particules, on raisonne avec les grandeurs totales : quantité de mouvement, moment cinétique, énergie. Leur conservation permet de résoudre les chocs sans connaître le détail des forces.

@section Lois de conservation
- **Centre de masse** : $\vec R = \dfrac{\sum m_i\vec q_i}{\sum m_i}$, masse totale $M$.
> $\dot{\vec P} = \vec F^{ext}$ avec $\vec P = \sum\vec p_i = M\dot{\vec R}$ : le centre de masse bouge comme une particule de masse $M$ soumise aux forces extérieures. Les forces internes se compensent (3e loi).
- Si $\vec F^{ext} = 0$ : $\vec P$ est **conservée**.
- **Moment cinétique** $\vec L = \sum\vec q_i\times\vec p_i$ ; $\dot{\vec L} = \vec M^{ext}$ (moment des forces extérieures). Conservé si $\vec M^{ext} = 0$.
- **Énergie** : conservée si toutes les forces sont conservatives.

@section Chocs
- Pendant un choc (forces extérieures négligeables) : **$\vec P$ est toujours conservée**.
- **Élastique** : l'énergie cinétique est aussi conservée.
- **Inélastique** : une partie de l'énergie cinétique est dissipée. **Parfaitement inélastique** : les corps restent collés, $v' = \dfrac{m_1v_1+m_2v_2}{m_1+m_2}$.
- Choc élastique 1D (cible au repos) : $v_1' = \dfrac{m_1-m_2}{m_1+m_2}v_1$, $v_2' = \dfrac{2m_1}{m_1+m_2}v_1$.
- Cas limites : masses égales → échange des vitesses ; $m_2\gg m_1$ → rebond ($v_1'\approx-v_1$) ; $m_1\gg m_2$ → $v_2'\approx2v_1$.
{{viz:collision}}

@section Problème à deux corps
- On sépare le mouvement du centre de masse (uniforme si isolé) du **mouvement relatif** $\vec q = \vec q_1-\vec q_2$.
> Le mouvement relatif est celui d'**une** particule de **masse réduite** $\mu = \dfrac{m_1m_2}{m_1+m_2}$ : $\mu\ddot{\vec q} = \vec F$.
- Dans le référentiel du centre de masse, la quantité de mouvement totale est nulle : $\vec p_1 = -\vec p_2$. Un choc élastique y fait simplement **tourner** les vitesses sans changer leur norme.

@section Systèmes à masse variable
- Fusée éjectant des gaz à vitesse $u$ (relative) : conservation de la quantité de mouvement ⟹ $m\,dv = -u\,dm$.
> **Équation de la fusée (Tsiolkovski)** : $v-v_0 = u\ln\dfrac{m_0}{m}$.

@formulas
Centre de masse :: \vec R=\frac{1}{M}\sum_i m_i\vec q_i,\qquad M\ddot{\vec R}=\vec F^{ext}
Moment cinétique :: \vec L=\sum_i\vec q_i\times\vec p_i,\qquad \dot{\vec L}=\vec M^{ext}
Choc élastique 1D (cible au repos) :: v_1'=\frac{m_1-m_2}{m_1+m_2}v_1,\qquad v_2'=\frac{2m_1}{m_1+m_2}v_1
Choc parfaitement inélastique :: v'=\frac{m_1v_1+m_2v_2}{m_1+m_2}
Masse réduite :: \mu=\frac{m_1m_2}{m_1+m_2}
Équation de la fusée :: v-v_0=u\ln\frac{m_0}{m}

@pitfalls
- Dans un choc inélastique, la quantité de mouvement est conservée mais **pas** l'énergie cinétique.
- La quantité de mouvement est un **vecteur** : la conserver composante par composante en 2D/3D.
- La masse réduite est plus petite que la plus petite des deux masses.

@cards
Que vaut $\dot{\vec P}$ pour un système de particules ? :: La somme des forces **extérieures** : $\dot{\vec P} = \vec F^{ext}$.
Qu'est-ce qui est conservé dans tout choc (système isolé) ? :: La quantité de mouvement totale.
Différence choc élastique / inélastique ? :: Élastique : l'énergie cinétique est conservée. Inélastique : elle ne l'est pas.
Masse réduite ? :: $\mu = \dfrac{m_1m_2}{m_1+m_2}$
Équation de la fusée ? :: $v-v_0 = u\ln(m_0/m)$
Choc élastique frontal entre deux masses égales (l'une au repos) ? :: Elles échangent leurs vitesses.
Quand le moment cinétique total est-il conservé ? :: Quand le moment des forces extérieures est nul.
Vitesse après un choc parfaitement inélastique ? :: $\dfrac{m_1v_1+m_2v_2}{m_1+m_2}$ (vitesse du centre de masse).

@quiz
? Lors d'un choc inélastique entre deux corps isolés, quelle grandeur est conservée ?
+ La quantité de mouvement totale
- L'énergie cinétique totale
- Les deux
- Aucune
= $\vec P$ est toujours conservée sans force extérieure ; l'énergie cinétique est en partie dissipée.
? Une bille heurte élastiquement et de face une bille identique au repos. Après le choc,
+ la première s'arrête et la seconde part avec la vitesse initiale
- les deux partent ensemble à la moitié de la vitesse
- la première rebondit en arrière
- les deux s'arrêtent
= Masses égales : $v_1' = 0$, $v_2' = v_1$ (échange des vitesses).
? La masse réduite de deux masses égales $m$ vaut
+ $m/2$
- $2m$
- $m$
- $m^2$
= $\mu = m\cdot m/(2m)$.
? Un wagon de masse $m$ à la vitesse $v$ s'accroche à un wagon identique immobile. La vitesse finale est
+ $v/2$
- $v$
- $v/\sqrt2$
- $0$
= Parfaitement inélastique : $mv = 2mv'$.
? Le centre de masse d'un système isolé
+ a un mouvement rectiligne uniforme
- est toujours au repos
- accélère sous l'effet des forces internes
- décrit un cercle
= $M\ddot{\vec R} = \vec F^{ext} = 0$ ; les forces internes s'annulent deux à deux.
? Une fusée de masse initiale $m_0$ éjecte ses gaz à vitesse $u$. Pour gagner $\Delta v = u$, sa masse doit tomber à
+ $m_0/e$
- $m_0/2$
- $m_0-u$
- $m_0/10$
= $\Delta v = u\ln(m_0/m) = u$ ⟹ $m_0/m = e$.
? Une balle légère heurte élastiquement un mur très lourd immobile. Sa vitesse après le choc est environ
+ $-v$ (elle rebondit avec la même vitesse)
- $0$
- $2v$
- $v/2$
= Limite $m_2\gg m_1$ : $v_1'\to-v_1$.

@chapter gaz | 4. Théorie cinétique des gaz
@intro Un gaz est un très grand nombre de particules en mouvement. La pression et la température s'expliquent par la mécanique de ces particules, traitées statistiquement.

@section Pression d'un gaz : dérivation
- Hypothèses : $N$ particules ponctuelles, chocs élastiques sur les parois, pas d'interactions, directions isotropes.
- Une particule de vitesse $v_x$ qui rebondit sur une paroi lui transfère $2mv_x$.
- En sommant sur toutes les particules et avec $\langle v_x^2\rangle = \tfrac13\langle v^2\rangle$ (isotropie) :
> $PV = \tfrac13Nm\langle v^2\rangle = \tfrac23N\langle E_{cin}\rangle$.

@section Température
- En comparant à la loi des gaz parfaits $PV = Nk_BT$ :
> $\langle E_{cin}\rangle = \tfrac12m\langle v^2\rangle = \tfrac32k_BT$ : la température mesure l'**énergie cinétique moyenne** d'agitation.
- **Vitesse quadratique moyenne** : $v_{rms} = \sqrt{\langle v^2\rangle} = \sqrt{3k_BT/m}$. (Air à 300 K : ~500 m/s.)
- $k_B = 1{,}38\times10^{-23}$ J/K ; $R = N_Ak_B = 8{,}31$ J/(mol·K).

@section Distribution des vitesses
- Toutes les particules n'ont pas la même vitesse : **distribution de Maxwell–Boltzmann** $f(v)\propto v^2\exp\!\left(-\dfrac{mv^2}{2k_BT}\right)$.
- Quand $T$ augmente : la distribution s'élargit et se décale vers les grandes vitesses.
- Trois vitesses typiques : la plus probable $\sqrt{2k_BT/m}$ < la moyenne $\sqrt{8k_BT/\pi m}$ < $v_{rms} = \sqrt{3k_BT/m}$.
{{viz:maxwell}}

@section Équipartition
> **Théorème d'équipartition** : à l'équilibre, chaque degré de liberté **quadratique** de l'énergie porte en moyenne $\tfrac12k_BT$.
- Gaz monoatomique : 3 degrés (translation) ⟹ $U = \tfrac32Nk_BT$.
- Gaz diatomique (température ambiante) : 3 translations + 2 rotations ⟹ $U = \tfrac52Nk_BT$.
- Oscillateur harmonique : 2 termes quadratiques (cinétique + potentiel) ⟹ $k_BT$.

@formulas
Pression cinétique :: PV=\tfrac13Nm\langle v^2\rangle
Énergie cinétique moyenne :: \langle E_{cin}\rangle=\tfrac32k_BT
Vitesse quadratique moyenne :: v_{rms}=\sqrt{\frac{3k_BT}{m}}
Maxwell–Boltzmann :: f(v)=4\pi\left(\frac{m}{2\pi k_BT}\right)^{3/2}v^2\,e^{-mv^2/2k_BT}
Équipartition :: \langle E\rangle=\tfrac12k_BT\ \text{par degré de liberté quadratique}
Énergie interne :: U=\tfrac f2Nk_BT\quad(f=3\text{ mono},\ 5\text{ diatomique})

@pitfalls
- $T$ doit être en **kelvins**.
- $\langle v_x^2\rangle = \tfrac13\langle v^2\rangle$ : le facteur 1/3 vient des trois directions équivalentes.
- $v_{rms}$, vitesse moyenne et vitesse la plus probable sont trois valeurs différentes.

@cards
Relation entre pression et vitesses des particules ? :: $PV = \tfrac13Nm\langle v^2\rangle$
Énergie cinétique moyenne d'une particule de gaz ? :: $\tfrac32k_BT$
Vitesse quadratique moyenne ? :: $v_{rms} = \sqrt{3k_BT/m}$
Théorème d'équipartition ? :: Chaque degré de liberté quadratique porte $\tfrac12k_BT$ en moyenne.
Énergie interne d'un gaz parfait monoatomique ? :: $U = \tfrac32Nk_BT$
Forme de la distribution de Maxwell–Boltzmann ? :: $f(v)\propto v^2e^{-mv^2/2k_BT}$
Interprétation microscopique de la température ? :: Mesure de l'énergie cinétique moyenne d'agitation des particules.
Énergie interne d'un gaz diatomique à température ambiante ? :: $U = \tfrac52Nk_BT$ (3 translations + 2 rotations).

@quiz
? L'énergie cinétique moyenne de translation d'une molécule de gaz parfait est
+ $\tfrac32k_BT$
- $\tfrac12k_BT$
- $k_BT$
- $3k_BT$
= $\tfrac12k_BT$ pour chacune des 3 directions de translation.
? Si on quadruple la température absolue d'un gaz, la vitesse quadratique moyenne est multipliée par
+ 2
- 4
- 16
- $\sqrt2$
= $v_{rms}\propto\sqrt T$.
? Le facteur $1/3$ dans $PV = \frac13Nm\langle v^2\rangle$ provient
+ de l'isotropie : $\langle v_x^2\rangle = \frac13\langle v^2\rangle$
- du nombre de particules
- de la forme cubique de la boîte
- de la constante de Boltzmann
= Les trois directions de l'espace sont équivalentes.
? À la même température, les molécules les plus rapides en moyenne sont
+ les plus légères
- les plus lourdes
- toutes ont la même vitesse moyenne
- les plus grosses
= $v_{rms} = \sqrt{3k_BT/m}$ : même énergie cinétique moyenne, donc vitesse plus grande si $m$ est petite.
? L'énergie interne d'un gaz parfait diatomique à température ambiante est
+ $\tfrac52Nk_BT$
- $\tfrac32Nk_BT$
- $3Nk_BT$
- $\tfrac12Nk_BT$
= 5 degrés de liberté quadratiques : 3 de translation et 2 de rotation.
? Quand la température augmente, la distribution de Maxwell–Boltzmann
+ s'élargit et son maximum se déplace vers les grandes vitesses
- devient plus étroite
- ne change pas
- se déplace vers les petites vitesses
= La vitesse la plus probable vaut $\sqrt{2k_BT/m}$.

@chapter relativite | 5. Relativité restreinte
@intro La vitesse de la lumière est la même dans tous les référentiels inertiels. Conséquences : le temps et l'espace dépendent de l'observateur, et masse et énergie sont liées.

@section Pourquoi la relativité ?
- Les équations de Maxwell prédisent une vitesse de la lumière $c$ fixe, incompatible avec l'addition galiléenne des vitesses.
- **Michelson–Morley (1887)** : aucune variation de $c$ selon la direction du mouvement de la Terre ⟹ pas d'« éther ».
> **Postulats d'Einstein** : (1) les lois de la physique sont les mêmes dans tous les référentiels inertiels ; (2) $c$ est la même dans tous les référentiels inertiels.
- Conséquence : la **simultanéité est relative** (paradoxe de l'éclair).

@section Transformation de Lorentz
- Référentiel $S'$ de vitesse $v$ selon $x$ ; $\beta = v/c$, $\gamma = \dfrac{1}{\sqrt{1-\beta^2}}\ge1$.
> $x' = \gamma(x-vt)$, $\quad t' = \gamma\!\left(t-\dfrac{vx}{c^2}\right)$, $\quad y' = y$, $z' = z$.
- Pour $v\ll c$ : $\gamma\to1$, on retrouve Galilée.
- **Intervalle invariant** : $s^2 = c^2t^2-x^2-y^2-z^2$ a la même valeur dans tous les référentiels. Quadrivecteur $(ct,\vec x)$.
- $s^2>0$ : genre **temps** (lien causal possible) ; $s^2<0$ : genre **espace** ; $s^2 = 0$ : genre **lumière**.

@section Conséquences cinématiques
- **Dilatation du temps** : $\Delta t = \gamma\,\Delta\tau$. Une horloge en mouvement retarde ($\tau$ = temps propre, mesuré dans le référentiel où l'horloge est au repos).
- **Contraction des longueurs** : $L = L_0/\gamma$ dans la direction du mouvement ($L_0$ = longueur propre).
- **Addition des vitesses** : $u' = \dfrac{u-v}{1-uv/c^2}$ ; on ne dépasse jamais $c$.
{{viz:lorentz}}

@section Dynamique relativiste
- Quantité de mouvement : $\vec p = \gamma m\vec v$. Énergie : $E = \gamma mc^2$.
- Énergie au repos $E_0 = mc^2$ ; énergie cinétique $T = (\gamma-1)mc^2\approx\tfrac12mv^2$ si $v\ll c$.
> **Relation fondamentale** : $E^2 = p^2c^2+m^2c^4$ — c'est l'invariant du **quadrivecteur énergie-impulsion** $(E/c,\vec p)$.
- Photon ($m = 0$) : $E = pc$. Vitesse d'une particule : $\vec v = \vec pc^2/E$.

@section Chocs relativistes
- On conserve l'**énergie totale** $E$ et la **quantité de mouvement** $\vec p$ (le quadrivecteur total). La masse n'est **pas** conservée.
- Choc inélastique : de l'énergie cinétique devient de la masse ($M>m_1+m_2$).
- Masse invariante d'un système : $M^2c^4 = (\sum E)^2-(\sum\vec p)^2c^2$, identique dans tous les référentiels — très utile pour passer du laboratoire au centre de masse.

@formulas
Facteur de Lorentz :: \gamma=\frac{1}{\sqrt{1-v^2/c^2}}
Transformation de Lorentz :: x'=\gamma(x-vt),\qquad t'=\gamma\left(t-\frac{vx}{c^2}\right)
Intervalle :: s^2=c^2t^2-x^2-y^2-z^2
Dilatation du temps :: \Delta t=\gamma\,\Delta\tau
Contraction des longueurs :: L=L_0/\gamma
Addition des vitesses :: u'=\frac{u-v}{1-uv/c^2}
Énergie et impulsion :: E=\gamma mc^2,\qquad \vec p=\gamma m\vec v
Relation énergie-impulsion :: E^2=p^2c^2+m^2c^4

@pitfalls
- Le temps propre est le plus **court** ; la longueur propre est la plus **longue**.
- La contraction n'a lieu que dans la direction du mouvement.
- En relativité, $T\neq\tfrac12mv^2$ : utiliser $T = (\gamma-1)mc^2$.

@cards
Les deux postulats d'Einstein ? :: (1) Mêmes lois physiques dans tous les référentiels inertiels. (2) $c$ est identique dans tous les référentiels inertiels.
Facteur de Lorentz ? :: $\gamma = 1/\sqrt{1-v^2/c^2}$
Transformation de Lorentz pour $t'$ ? :: $t' = \gamma(t-vx/c^2)$
Dilatation du temps ? :: $\Delta t = \gamma\Delta\tau$ : l'horloge en mouvement retarde.
Contraction des longueurs ? :: $L = L_0/\gamma$
Relation énergie–impulsion ? :: $E^2 = p^2c^2+m^2c^4$
Énergie cinétique relativiste ? :: $T = (\gamma-1)mc^2$
Quelle grandeur d'espace-temps est invariante ? :: L'intervalle $s^2 = c^2t^2-x^2-y^2-z^2$.
Qu'a montré l'expérience de Michelson–Morley ? :: Que la vitesse de la lumière ne dépend pas du mouvement de la Terre (pas d'éther).

@quiz
? Pour $v = 0{,}6\,c$, le facteur $\gamma$ vaut
+ $1{,}25$
- $1{,}67$
- $0{,}8$
- $2$
= $\gamma = 1/\sqrt{1-0{,}36} = 1/0{,}8$.
? Une horloge se déplace à grande vitesse par rapport à vous. Vous observez qu'elle
+ retarde (bat plus lentement)
- avance
- bat au même rythme
- s'arrête
= Dilatation du temps : $\Delta t = \gamma\Delta\tau>\Delta\tau$.
? Une règle de longueur propre $L_0$ se déplace à la vitesse $v$ le long de son axe. Sa longueur mesurée est
+ $L_0/\gamma$
- $\gamma L_0$
- $L_0$
- $L_0/\gamma^2$
= Contraction des longueurs dans la direction du mouvement.
? Pour un photon, la relation entre énergie et quantité de mouvement est
+ $E = pc$
- $E = mc^2$
- $E = p^2/2m$
- $E = 0$
= $E^2 = p^2c^2+m^2c^4$ avec $m = 0$.
? Quelle quantité est la même dans tous les référentiels inertiels ?
+ $c^2t^2-x^2-y^2-z^2$
- $t$
- $x^2+y^2+z^2$
- l'énergie $E$
= C'est l'intervalle d'espace-temps, invariant de Lorentz.
? Une fusée va à $0{,}5\,c$ et lance vers l'avant un projectile à $0{,}5\,c$ par rapport à elle. Vu du sol, le projectile va à
+ $0{,}8\,c$
- $c$
- $0{,}5\,c$
- $0{,}75\,c$
= $(0{,}5+0{,}5)c/(1+0{,}25) = 0{,}8c$.
? Dans un choc relativiste, on conserve
+ l'énergie totale et la quantité de mouvement
- la masse totale
- l'énergie cinétique seulement
- la somme des vitesses
= La masse peut changer : de l'énergie cinétique peut se transformer en masse et inversement.

@chapter oscillations | 6. Systèmes oscillants et ondes
@intro De l'oscillateur simple aux ondes : amortissement, résonance, oscillateurs couplés et modes normaux, puis passage à la limite continue qui donne l'équation d'onde.

@section Oscillateur amorti
- Avec frottement $-c\dot q$ : $\ddot q+2\lambda\dot q+\omega_0^2q = 0$, où $2\lambda = c/m$, $\omega_0 = \sqrt{k/m}$.
- On cherche $q = Ae^{\gamma t}$ ⟹ $\gamma = -\lambda\pm\sqrt{\lambda^2-\omega_0^2}$. Trois régimes :
- **Faible** ($\lambda<\omega_0$) : $q = Ae^{-\lambda t}\cos(\omega_1t+\varphi)$ avec $\omega_1 = \sqrt{\omega_0^2-\lambda^2}<\omega_0$ — oscillations dont l'amplitude décroît.
- **Critique** ($\lambda = \omega_0$) : $q = (A+Bt)e^{-\lambda t}$ — retour à l'équilibre **le plus rapide**, sans oscillation.
- **Suramorti** ($\lambda>\omega_0$) : somme de deux exponentielles décroissantes — retour lent, sans oscillation.
{{viz:oscillateur}}

@section Oscillateur forcé et résonance
- $\ddot q+2\lambda\dot q+\omega_0^2q = \dfrac{F_0}{m}\cos\omega t$.
- Solution = **transitoire** (solution homogène, qui s'éteint) + **régime stationnaire** $q = A(\omega)\cos(\omega t-\delta)$ : le système oscille à la fréquence **de la force**.
> $A(\omega) = \dfrac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2+4\lambda^2\omega^2}}$, $\quad\tan\delta = \dfrac{2\lambda\omega}{\omega_0^2-\omega^2}$.
- **Résonance** : amplitude maximale pour $\omega_r = \sqrt{\omega_0^2-2\lambda^2}\approx\omega_0$. Plus l'amortissement est faible, plus le pic est haut et étroit. Sans amortissement, l'amplitude diverge en $\omega = \omega_0$.
- Déphasage : $\delta\approx0$ à basse fréquence, $\pi/2$ à la résonance, $\pi$ à haute fréquence.
- Force périodique quelconque : on la décompose en série de Fourier et on superpose les réponses.
{{viz:resonance}}

@section Oscillateurs couplés
- Deux masses identiques reliées par un ressort de couplage $k'$ : le mouvement général est une superposition de **deux modes normaux**.
- **Mode symétrique** (en phase) : $\omega_s = \sqrt{k/m}$ — le ressort de couplage ne travaille pas.
- **Mode antisymétrique** (en opposition) : $\omega_a = \sqrt{(k+2k')/m}$.
- Méthode : écrire $M\ddot{\vec q} = -K\vec q$, chercher $\vec q = \vec a\,e^{i\omega t}$ ⟹ $\det(K-\omega^2M) = 0$. $N$ oscillateurs ⟹ $N$ modes normaux.
- Couplage faible : **battements**, l'énergie passe d'un oscillateur à l'autre à la fréquence $(\omega_a-\omega_s)$.

@section Ondes
- Limite continue d'une chaîne de $N\to\infty$ oscillateurs couplés :
> **Équation d'onde** : $\dfrac{\partial^2u}{\partial t^2} = c^2\dfrac{\partial^2u}{\partial x^2}$ (corde : $c = \sqrt{T/\mu}$).
- **Ondes progressives** : $u = f(x-ct)+g(x+ct)$. Sinusoïdale : $u = A\cos(kx-\omega t)$ avec $\omega = ck$, $\lambda = 2\pi/k$, $c = \lambda\nu$.
- **Superposition** : la somme de deux solutions est une solution (interférences, battements).
- **Ondes stationnaires** : deux ondes progressives opposées ⟹ $u = 2A\sin(kx)\cos(\omega t)$, avec nœuds et ventres. Corde fixée aux deux bouts : $\lambda_n = 2L/n$, $\nu_n = n\,c/2L$.

@formulas
Oscillateur amorti :: \ddot q+2\lambda\dot q+\omega_0^2q=0
Amortissement faible :: q=Ae^{-\lambda t}\cos(\omega_1t+\varphi),\qquad \omega_1=\sqrt{\omega_0^2-\lambda^2}
Amplitude forcée :: A(\omega)=\frac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2+4\lambda^2\omega^2}}
Déphasage :: \tan\delta=\frac{2\lambda\omega}{\omega_0^2-\omega^2}
Résonance :: \omega_r=\sqrt{\omega_0^2-2\lambda^2}
Modes de deux oscillateurs couplés :: \omega_s=\sqrt{\frac km},\qquad \omega_a=\sqrt{\frac{k+2k'}{m}}
Équation d'onde :: \frac{\partial^2u}{\partial t^2}=c^2\frac{\partial^2u}{\partial x^2}
Onde progressive :: u=A\cos(kx-\omega t),\quad \omega=ck,\quad \lambda=\frac{2\pi}{k}
Corde fixée :: \nu_n=\frac{n\,c}{2L}

@pitfalls
- En régime stationnaire, l'oscillateur forcé oscille à la fréquence de la force, pas à sa fréquence propre.
- L'amortissement critique donne le retour le plus rapide ; suramortir **ralentit** le retour.
- $\omega_1<\omega_0$ : l'amortissement allonge la pseudo-période.

@cards
Équation de l'oscillateur amorti ? :: $\ddot q+2\lambda\dot q+\omega_0^2q = 0$
Les trois régimes d'amortissement ? :: Faible ($\lambda<\omega_0$, oscille), critique ($\lambda=\omega_0$), suramorti ($\lambda>\omega_0$).
Pseudo-pulsation en amortissement faible ? :: $\omega_1 = \sqrt{\omega_0^2-\lambda^2}$
Amplitude en régime forcé stationnaire ? :: $A(\omega) = \dfrac{F_0/m}{\sqrt{(\omega_0^2-\omega^2)^2+4\lambda^2\omega^2}}$
Qu'est-ce que la résonance ? :: L'amplitude est maximale quand la fréquence d'excitation est proche de la fréquence propre ($\omega_r = \sqrt{\omega_0^2-2\lambda^2}$).
Qu'est-ce qu'un mode normal ? :: Un mouvement où toutes les parties oscillent à la même fréquence.
Équation d'onde ? :: $\partial_t^2u = c^2\partial_x^2u$
Forme générale d'une onde progressive ? :: $u = f(x-ct)+g(x+ct)$
Fréquences propres d'une corde fixée aux deux bouts ? :: $\nu_n = nc/2L$
Déphasage à la résonance ? :: $\pi/2$

@quiz
? Pour un oscillateur faiblement amorti, la pulsation des oscillations est
+ $\sqrt{\omega_0^2-\lambda^2}$
- $\omega_0$
- $\sqrt{\omega_0^2+\lambda^2}$
- $\lambda$
= Le frottement ralentit légèrement les oscillations : $\omega_1<\omega_0$.
? Quel régime ramène le plus vite à l'équilibre sans osciller ?
+ L'amortissement critique
- Le suramortissement
- L'amortissement faible
- Tous à la même vitesse
= C'est pourquoi les amortisseurs sont réglés près du régime critique.
? En régime stationnaire, un oscillateur forcé oscille à
+ la fréquence de la force excitatrice
- sa fréquence propre $\omega_0$
- la moyenne des deux
- $\omega_1$
= Le transitoire (à $\omega_1$) s'éteint ; seule reste la réponse à $\omega$.
? À la résonance, la force et le déplacement sont déphasés de
+ $\pi/2$
- $0$
- $\pi$
- $2\pi$
= $\tan\delta\to\infty$ quand $\omega = \omega_0$.
? Deux pendules identiques couplés par un ressort. Dans le mode symétrique (en phase), la fréquence est
+ celle d'un pendule seul
- plus élevée que celle d'un pendule seul
- nulle
- deux fois celle d'un pendule seul
= Le ressort de couplage n'est ni étiré ni comprimé : il ne joue aucun rôle.
? Laquelle de ces fonctions est solution de l'équation d'onde de célérité $c$ ?
+ $f(x-ct)$ pour toute fonction $f$ deux fois dérivable
- $f(x)-ct$
- $e^{-ct}f(x)$
- $f(x^2-c^2t^2)$
= $f(x-ct)$ est un profil qui se déplace sans se déformer à la vitesse $c$.
? Une corde de longueur $L$ fixée aux deux extrémités : la longueur d'onde du mode fondamental est
+ $2L$
- $L$
- $L/2$
- $4L$
= Un demi-fuseau : $L = \lambda/2$.
? Si l'on diminue l'amortissement, le pic de résonance devient
+ plus haut et plus étroit
- plus bas et plus large
- plus haut et plus large
- inchangé
= À la limite sans amortissement, l'amplitude diverge.

@chapter rigide | 7. Corps rigide
@intro Un corps rigide est un ensemble de particules à distances fixes. Son mouvement se décompose en translation du centre de masse et rotation, gouvernée par le moment d'inertie.

@section Description
- 6 degrés de liberté : 3 pour la position du centre de masse, 3 pour l'orientation (angles d'Euler).
- Centre de masse : $\vec R = \dfrac1M\displaystyle\int\vec r\,dm$. Pour un corps homogène et symétrique, il est sur les axes/plans de symétrie.
- Vitesse d'un point : $\vec v = \vec V_{CM}+\vec\omega\times\vec r$.

@section Rotation autour d'un axe fixe
- **Moment d'inertie** : $I = \sum m_ir_i^2 = \displaystyle\int r^2\,dm$ ($r$ = distance à l'axe). Il mesure « l'inertie de rotation ».
> $L = I\omega$, $\quad T_{rot} = \tfrac12I\omega^2$, $\quad M = I\dot\omega$ (analogues de $p = mv$, $T = \tfrac12mv^2$, $F = ma$).
- Valeurs à connaître (masse $M$) : anneau $MR^2$ ; disque/cylindre plein $\tfrac12MR^2$ ; sphère pleine $\tfrac25MR^2$ ; tige par son centre $\tfrac1{12}ML^2$, par une extrémité $\tfrac13ML^2$.
- **Axe parallèle (Steiner)** : $I = I_{CM}+Md^2$.
- **Axe perpendiculaire** (plaque plane dans le plan $xy$) : $I_z = I_x+I_y$.
- **Rayon de giration** $k$ : $I = Mk^2$.
- **Pendule physique** : $\omega_0 = \sqrt{Mgd/I}$ ($d$ = distance axe–centre de masse).
- Roulement sans glissement : $v_{CM} = R\omega$, $T = \tfrac12Mv^2+\tfrac12I_{CM}\omega^2$.

@section Rotation autour d'un point fixe
- En général $\vec L$ n'est **pas parallèle** à $\vec\omega$ : $\vec L = \mathbf I\,\vec\omega$ où $\mathbf I$ est le **tenseur d'inertie** (matrice $3\times3$ symétrique).
- $I_{xx} = \int(y^2+z^2)\,dm$, $I_{xy} = -\int xy\,dm$, etc. Énergie : $T = \tfrac12\vec\omega\cdot\mathbf I\,\vec\omega$.
> **Axes principaux d'inertie** : base où $\mathbf I$ est diagonale ($I_1, I_2, I_3$) — ce sont les vecteurs propres. Si $\vec\omega$ est le long d'un axe principal, alors $\vec L\parallel\vec\omega$.
- **Équilibrage** : un rotor est équilibré si son axe de rotation est un axe principal passant par le centre de masse (sinon vibrations).

@section Équations d'Euler et toupie
- Dans le repère des axes principaux lié au corps : $I_1\dot\omega_1-(I_2-I_3)\omega_2\omega_3 = M_1$ (et permutations circulaires).
- **Toupie symétrique libre** ($I_1 = I_2$, $\vec M = 0$) : $\omega_3$ constant et $\vec\omega$ **précesse** autour de l'axe de symétrie.
- **Toupie pesante** : le poids crée un moment perpendiculaire à $\vec L$ ⟹ $\vec L$ tourne sans changer de norme : **précession** de vitesse angulaire $\Omega = \dfrac{Mgl}{I_3\omega_3}$.

@formulas
Moment d'inertie :: I=\int r^2\,dm
Rotation autour d'un axe :: L=I\omega,\qquad T=\tfrac12I\omega^2,\qquad M=I\dot\omega
Axe parallèle (Steiner) :: I=I_{CM}+Md^2
Axe perpendiculaire :: I_z=I_x+I_y
Moments usuels :: I_{disque}=\tfrac12MR^2,\quad I_{sph\grave ere}=\tfrac25MR^2,\quad I_{tige,\,centre}=\tfrac1{12}ML^2
Pendule physique :: \omega_0=\sqrt{\frac{Mgd}{I}}
Tenseur d'inertie :: \vec L=\mathbf I\,\vec\omega,\qquad T=\tfrac12\,\vec\omega\cdot\mathbf I\,\vec\omega
Équations d'Euler :: I_1\dot\omega_1-(I_2-I_3)\omega_2\omega_3=M_1
Précession de la toupie :: \Omega=\frac{Mgl}{I_3\omega_3}

@pitfalls
- Le moment d'inertie dépend de l'**axe** choisi, pas seulement du corps.
- Steiner ne s'applique qu'à partir d'un axe passant par le **centre de masse**.
- $\vec L$ et $\vec\omega$ ne sont parallèles que pour une rotation autour d'un axe principal.

@cards
Définition du moment d'inertie ? :: $I = \int r^2\,dm$, $r$ étant la distance à l'axe de rotation.
Théorème de l'axe parallèle (Steiner) ? :: $I = I_{CM}+Md^2$
Moment d'inertie d'un disque plein par rapport à son axe ? :: $\tfrac12MR^2$
Moment d'inertie d'une sphère pleine ? :: $\tfrac25MR^2$
Moment d'inertie d'une tige par rapport à son centre / son extrémité ? :: $\tfrac1{12}ML^2$ / $\tfrac13ML^2$
Énergie cinétique de rotation ? :: $\tfrac12I\omega^2$
Que sont les axes principaux d'inertie ? :: Les axes dans lesquels le tenseur d'inertie est diagonal ; $\vec L\parallel\vec\omega$ pour une rotation autour de l'un d'eux.
Théorème de l'axe perpendiculaire ? :: Pour une plaque plane : $I_z = I_x+I_y$.
Vitesse de précession d'une toupie pesante ? :: $\Omega = Mgl/(I_3\omega_3)$
Combien de degrés de liberté a un corps rigide ? :: 6 (3 de translation, 3 de rotation).

@quiz
? Le moment d'inertie d'une tige de masse $M$ et longueur $L$ par rapport à une extrémité est
+ $\tfrac13ML^2$
- $\tfrac1{12}ML^2$
- $\tfrac12ML^2$
- $ML^2$
= Steiner : $\tfrac1{12}ML^2+M(L/2)^2 = \tfrac13ML^2$.
? Un anneau et un disque plein de même masse et même rayon roulent sans glisser sur un plan incliné. Lequel arrive en bas le premier ?
+ Le disque
- L'anneau
- Ils arrivent ensemble
- Cela dépend de la masse
= Le disque a un moment d'inertie plus petit ($\frac12MR^2$ contre $MR^2$) : moins d'énergie part en rotation.
? L'analogue en rotation de $F = ma$ est
+ $M = I\dot\omega$
- $L = I\omega$
- $T = \tfrac12I\omega^2$
- $I = MR^2$
= Moment de force = moment d'inertie × accélération angulaire.
? Le moment cinétique $\vec L$ est parallèle à $\vec\omega$
+ lorsque la rotation se fait autour d'un axe principal d'inertie
- toujours
- jamais
- seulement pour une sphère
= En général $\vec L = \mathbf I\vec\omega$ avec $\mathbf I$ une matrice ; pour une sphère c'est vrai pour tout axe, car tous sont principaux.
? Un corps rigide libre dans l'espace possède
+ 6 degrés de liberté
- 3 degrés de liberté
- 9 degrés de liberté
- une infinité de degrés de liberté
= 3 pour le centre de masse, 3 pour l'orientation.
? Une patineuse ramène ses bras le long du corps. Sa vitesse de rotation
+ augmente, car $I$ diminue et $L = I\omega$ est conservé
- diminue
- reste identique
- s'annule
= Sans moment extérieur, le moment cinétique est conservé.
? Pour une toupie pesante en rotation rapide, si la vitesse de rotation propre $\omega_3$ augmente, la précession
+ ralentit
- accélère
- ne change pas
- s'inverse
= $\Omega = Mgl/(I_3\omega_3)$ est inversement proportionnelle à $\omega_3$.

@chapter noninertiel | 8. Systèmes non inertiels
@intro Dans un référentiel accéléré ou en rotation, il faut ajouter des forces fictives (inertie, centrifuge, Coriolis) pour pouvoir utiliser $F = ma$. Application : la Terre en rotation.

@section Référentiels inertiels et Galilée
- Transformation de Galilée ($S'$ à vitesse constante $\vec V$) : $\vec q' = \vec q-\vec Vt$, $t' = t$ ⟹ même accélération ⟹ mêmes lois de Newton.
- **Principe de Galilée** : aucune expérience de mécanique ne distingue deux référentiels inertiels.

@section Référentiel en translation accélérée
- Si $S'$ a une accélération $\vec A$ : $m\vec a' = \vec F-m\vec A$.
- $-m\vec A$ est une **force d'inertie** (fictive) : ex. on est plaqué au siège quand la voiture accélère.

@section Référentiel en rotation
> Dérivée d'un vecteur : $\left(\dfrac{d}{dt}\right)_{inertiel} = \left(\dfrac{d}{dt}\right)_{tournant}+\vec\omega\times$
- En l'appliquant deux fois à $\vec r$ : $m\vec a' = \vec F-2m\,\vec\omega\times\vec v'-m\,\vec\omega\times(\vec\omega\times\vec r)-m\,\dot{\vec\omega}\times\vec r$
- **Force de Coriolis** $-2m\,\vec\omega\times\vec v'$ : n'existe que si la particule **bouge** dans le référentiel tournant ; perpendiculaire à la vitesse (ne travaille pas).
- **Force centrifuge** $-m\,\vec\omega\times(\vec\omega\times\vec r)$ : dirigée vers l'extérieur de l'axe, norme $m\omega^2\rho$ ($\rho$ = distance à l'axe).
- **Force d'Euler** $-m\dot{\vec\omega}\times\vec r$ : seulement si la rotation n'est pas uniforme.
{{viz:coriolis}}

@section Sur la Terre
- $\omega_T = 2\pi/(24\text{ h})\approx7{,}3\times10^{-5}$ rad/s.
- **Effet statique** (centrifuge) : $g$ effectif légèrement plus faible à l'équateur ; le fil à plomb ne pointe pas exactement vers le centre de la Terre.
- **Effet dynamique** (Coriolis) : déviation vers la **droite** dans l'hémisphère **nord**, vers la gauche dans le sud. Un corps en chute libre est dévié vers l'**est**. Explique le sens de rotation des cyclones.
> **Pendule de Foucault** : le plan d'oscillation tourne avec la période $T = \dfrac{24\text{ h}}{\sin\lambda}$ ($\lambda$ = latitude) : 24 h au pôle, infinie à l'équateur. Preuve directe de la rotation de la Terre.

@formulas
Translation accélérée :: m\vec a'=\vec F-m\vec A
Dérivée en repère tournant :: \left(\frac{d\vec u}{dt}\right)_{in}=\left(\frac{d\vec u}{dt}\right)_{rot}+\vec\omega\times\vec u
Force de Coriolis :: \vec F_{Cor}=-2m\,\vec\omega\times\vec v'
Force centrifuge :: \vec F_{cent}=-m\,\vec\omega\times(\vec\omega\times\vec r),\qquad |\vec F_{cent}|=m\omega^2\rho
Équation complète :: m\vec a'=\vec F-2m\vec\omega\times\vec v'-m\vec\omega\times(\vec\omega\times\vec r)-m\dot{\vec\omega}\times\vec r
Pendule de Foucault :: T=\frac{24\,\mathrm h}{\sin\lambda}

@pitfalls
- Les forces fictives n'existent que dans le référentiel non inertiel ; elles n'ont pas de « réaction » (pas de 3e loi).
- Coriolis est nulle pour un objet immobile dans le référentiel tournant ; la force centrifuge, elle, agit toujours.
- La force de Coriolis ne travaille pas : elle dévie sans changer la norme de la vitesse.

@cards
Expression de la force de Coriolis ? :: $-2m\,\vec\omega\times\vec v'$
Expression de la force centrifuge ? :: $-m\,\vec\omega\times(\vec\omega\times\vec r)$, de norme $m\omega^2\rho$, dirigée vers l'extérieur.
Lien entre dérivées en repère inertiel et tournant ? :: $(d/dt)_{in} = (d/dt)_{rot}+\vec\omega\times$
Sens de la déviation de Coriolis dans l'hémisphère nord ? :: Vers la droite du mouvement.
Période de rotation du plan du pendule de Foucault ? :: $24\text{ h}/\sin\lambda$ ($\lambda$ = latitude).
Force d'inertie dans un référentiel d'accélération $\vec A$ ? :: $-m\vec A$
Dans quelle direction est dévié un corps en chute libre sur Terre ? :: Vers l'est.
La force de Coriolis travaille-t-elle ? :: Non, elle est toujours perpendiculaire à la vitesse.

@quiz
? La force de Coriolis s'exerce sur un objet
+ en mouvement par rapport au référentiel tournant
- immobile dans le référentiel tournant
- dans tout référentiel inertiel
- seulement s'il est sur l'axe de rotation
= Elle est proportionnelle à la vitesse relative $\vec v'$.
? Dans l'hémisphère nord, la force de Coriolis dévie un projectile horizontal
+ vers la droite
- vers la gauche
- vers le haut
- elle ne le dévie pas
= Et vers la gauche dans l'hémisphère sud.
? La période de rotation du plan d'oscillation du pendule de Foucault à la latitude $\lambda$ est
+ $24\text{ h}/\sin\lambda$
- $24\text{ h}\cdot\sin\lambda$
- $24\text{ h}$ partout
- $24\text{ h}/\cos\lambda$
= 24 h au pôle ($\sin\lambda = 1$), pas de rotation à l'équateur.
? La force centrifuge sur une masse $m$ à distance $\rho$ de l'axe de rotation a pour norme
+ $m\omega^2\rho$
- $m\omega\rho$
- $2m\omega v$
- $m\omega^2/\rho$
= Elle est dirigée perpendiculairement à l'axe, vers l'extérieur.
? À cause de la rotation de la Terre, le poids apparent d'un objet est le plus faible
+ à l'équateur
- aux pôles
- à 45° de latitude
- il est partout le même
= La force centrifuge est maximale à l'équateur (distance à l'axe maximale).
? Dans un ascenseur qui accélère vers le haut avec l'accélération $A$, un objet de masse $m$ subit la force d'inertie
+ $mA$ vers le bas
- $mA$ vers le haut
- nulle
- $2mA$ vers le bas
= $-m\vec A$ : opposée à l'accélération du référentiel ; le poids apparent augmente.
? Un objet lâché du haut d'une tour (hémisphère nord) touche le sol légèrement
+ à l'est du pied de la tour
- à l'ouest
- au nord
- exactement au pied
= Déviation vers l'est due à la force de Coriolis.

@chapter fluides | 9. Mécanique des fluides
@intro Hydrostatique (fluide au repos : pression, Archimède, Pascal) et introduction à l'hydrodynamique (continuité et Bernoulli).

@section Pression et hydrostatique
- **Pression** : $p = F/A$ (force normale par unité de surface), en pascals (Pa = N/m²). Elle est **isotrope** (même valeur dans toutes les directions en un point).
> **Loi fondamentale** (fluide incompressible) : $p(h) = p_0+\rho gh$ — la pression augmente linéairement avec la profondeur $h$.
- Elle ne dépend que de la profondeur, pas de la forme du récipient (paradoxe hydrostatique).
- 1 atm ≈ $1{,}013\times10^5$ Pa ≈ 10 m d'eau.
- **Principe de Pascal** : une variation de pression se transmet intégralement dans tout le fluide ⟹ presse hydraulique : $F_2 = F_1\dfrac{A_2}{A_1}$.

@section Poussée d'Archimède
> Tout corps plongé dans un fluide subit une force verticale vers le haut égale au **poids du fluide déplacé** : $F_A = \rho_{fluide}\,V_{immergé}\,g$.
- Origine : la pression est plus grande en bas du corps qu'en haut.
- Le corps flotte si $\rho_{corps}<\rho_{fluide}$ ; fraction immergée = $\rho_{corps}/\rho_{fluide}$.

@section Fluide compressible (atmosphère)
- Pour un gaz parfait isotherme, $\rho\propto p$ ⟹ $\dfrac{dp}{dz} = -\rho g$ donne la **formule barométrique** : $p(z) = p_0\,e^{-z/H}$ avec $H = \dfrac{k_BT}{mg}$ (≈ 8 km).
- Les différences de pression horizontales mettent l'air en mouvement ; avec Coriolis, cela explique la **circulation des vents** autour des dépressions et anticyclones.

@section Hydrodynamique
- Fluide idéal : incompressible, non visqueux, écoulement stationnaire. **Lignes de courant** : tangentes à la vitesse.
> **Équation de continuité** (conservation du débit) : $A_1v_1 = A_2v_2$ — le fluide accélère quand le tube se resserre.
> **Bernoulli** (conservation de l'énergie le long d'une ligne de courant) : $p+\tfrac12\rho v^2+\rho gh = \text{constante}$.
- **Effet Venturi** : là où la section est étroite, la vitesse est grande et la **pression est basse**.
- **Torricelli** : vitesse de sortie par un trou à une profondeur $h$ sous la surface : $v = \sqrt{2gh}$ (comme une chute libre).
- Dans un tube de courant qui tourne, la pression augmente vers l'extérieur du virage.
{{viz:venturi}}

@formulas
Pression :: p=\frac FA
Hydrostatique :: p(h)=p_0+\rho gh
Pascal (presse hydraulique) :: \frac{F_1}{A_1}=\frac{F_2}{A_2}
Archimède :: F_A=\rho_{fluide}\,V_{immerg\acute e}\,g
Formule barométrique :: p(z)=p_0\,e^{-mgz/k_BT}
Continuité :: A_1v_1=A_2v_2
Bernoulli :: p+\tfrac12\rho v^2+\rho gh=\text{cste}
Torricelli :: v=\sqrt{2gh}

@pitfalls
- Archimède : c'est la masse volumique du **fluide** (et le volume immergé) qui compte, pas celle du corps.
- Bernoulli : grande vitesse ⟹ **basse** pression (contre-intuitif).
- Bernoulli suppose un fluide idéal (pas de viscosité) et un écoulement stationnaire.

@cards
Pression à la profondeur $h$ dans un liquide ? :: $p = p_0+\rho gh$
Poussée d'Archimède ? :: $F_A = \rho_{fluide}V_{immergé}g$ : le poids du fluide déplacé, vers le haut.
Principe de Pascal ? :: Une variation de pression appliquée à un fluide se transmet intégralement en tout point.
Équation de continuité ? :: $A_1v_1 = A_2v_2$
Équation de Bernoulli ? :: $p+\tfrac12\rho v^2+\rho gh = $ constante le long d'une ligne de courant.
Formule de Torricelli ? :: $v = \sqrt{2gh}$
Effet Venturi ? :: Dans un rétrécissement, la vitesse augmente et la pression diminue.
Formule barométrique ? :: $p(z) = p_0e^{-mgz/k_BT}$ (atmosphère isotherme).
Quelle fraction d'un corps flottant est immergée ? :: $\rho_{corps}/\rho_{fluide}$

@quiz
? À 10 m de profondeur dans l'eau, la pression totale vaut environ
+ 2 atm
- 1 atm
- 10 atm
- 11 atm
= 1 atm (atmosphère) + $\rho gh\approx10^5$ Pa ≈ 1 atm.
? La poussée d'Archimède sur un corps entièrement immergé dépend
+ du volume du corps et de la masse volumique du fluide
- de la masse du corps
- de la profondeur d'immersion
- de la forme du corps
= $F_A = \rho_{fluide}Vg$ : le poids du fluide déplacé.
? Un tuyau se rétrécit : sa section est divisée par 2. La vitesse de l'eau
+ double
- est divisée par 2
- ne change pas
- quadruple
= Continuité : $A_1v_1 = A_2v_2$.
? Dans le rétrécissement d'un tube de Venturi horizontal, la pression
+ diminue
- augmente
- reste la même
- devient infinie
= Bernoulli : la vitesse augmente, donc $p$ diminue.
? De l'eau s'écoule par un trou situé à 5 m sous la surface d'un réservoir. Sa vitesse de sortie est d'environ ($g\approx10$ m/s²)
+ 10 m/s
- 5 m/s
- 50 m/s
- 100 m/s
= Torricelli : $\sqrt{2\cdot10\cdot5} = 10$ m/s.
? Un glaçon (masse volumique 0,92 g/cm³) flotte dans l'eau. Quelle fraction de son volume est immergée ?
+ 92 %
- 8 %
- 50 %
- 100 %
= Fraction immergée = $\rho_{corps}/\rho_{fluide} = 0{,}92$.
? Dans une presse hydraulique, le grand piston a une surface 10 fois plus grande que le petit. La force exercée par le grand piston est
+ 10 fois plus grande
- 10 fois plus petite
- la même
- 100 fois plus grande
= Même pression des deux côtés (Pascal) : $F_2 = F_1A_2/A_1$.
`);
