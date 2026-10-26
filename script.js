// --- VARIABLES GLOBALES ---
var panier = JSON.parse(localStorage.getItem('atlas_panier')) || [];
var numeroWhatsApp = "2290143327643";

// Elements Menu
var grillePlats = document.getElementById('grille-plats');
var champRecherche = document.getElementById('champ-recherche');
var rubanFiltres = document.getElementById('ruban-filtres');
var cartCount = document.getElementById('cart-count');

// Elements Barre Flottante
var barrePanier = document.getElementById('barre-panier-flottante');
var barrePanierQte = document.getElementById('barre-panier-qte');
var barrePanierTotal = document.getElementById('barre-panier-total');

// Elements Page Panier
var listePanierPage = document.getElementById('liste-panier-page');
var formulaireCommande = document.getElementById('formulaire-commande');
var panierVideMessage = document.getElementById('panier-vide-message');
var totalPrixPage = document.getElementById('total-prix-page');
var btnWhatsApp = document.getElementById('btn-whatsapp');

// --- FONCTIONS UTILITAIRES ---
function enleverAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function estSimilaire(motRecherche, texte) {
  var mot = enleverAccents(motRecherche);
  var txt = enleverAccents(texte);
  if (txt.indexOf(mot) !== -1) return true;
  if (mot.length > 3) {
    var morceau = mot.substring(0, mot.length - 1);
    if (txt.indexOf(morceau) !== -1) return true;
  }
  return false;
}

function sauvegarderPanier() {
  localStorage.setItem('atlas_panier', JSON.stringify(panier));
}

function calculerTotal() {
  var total = 0;
  for (var i = 0; i < panier.length; i++) {
    total += panier[i].prix * panier[i].quantite;
  }
  return total;
}

function getQuantite(idPlat) {
  for (var i = 0; i < panier.length; i++) {
    if (panier[i].id === idPlat) return panier[i].quantite;
  }
  return 0;
}

// --- AFFICHAGE MENU ---
function afficherPlats(categorieFiltre, rechercheTexte) {
  if (!grillePlats) return;
  grillePlats.innerHTML = '';
  var platsTrouves = 0;

  for (var i = 0; i < menuData.length; i++) {
    var plat = menuData[i];
    var correspondCategorie = (categorieFiltre === 'Tout' || plat.categorie === categorieFiltre);
    var correspondRecherche = true;

    if (rechercheTexte && rechercheTexte.length > 0) {
      var matchNom = estSimilaire(rechercheTexte, plat.nom);
      var matchDesc = estSimilaire(rechercheTexte, plat.description);
      if (!matchNom && !matchDesc) correspondRecherche = false;
    }

    if (correspondCategorie && correspondRecherche) {
      platsTrouves++;
      var qte = getQuantite(plat.id);
      var boutonHTML = '';
      
      if (qte === 0) {
        boutonHTML = '<button class="btn-ajouter" onclick="ajouterAuPanier(' + plat.id + ')">Ajouter</button>';
      } else {
        boutonHTML = '<div class="controle-qte-menu"><button class="btn-qte-menu" onclick="modifierQteMenu(' + plat.id + ', -1)">-</button><span class="qte-menu-valeur">' + qte + '</span><button class="btn-qte-menu" onclick="modifierQteMenu(' + plat.id + ', 1)">+</button></div>';
      }

      var carte = document.createElement('div');
      carte.className = 'plat-carte';
      
      var html = '<div class="plat-header"><h3 class="plat-titre">' + plat.nom + '</h3><span class="plat-prix">' + plat.prix + ' F</span></div>';
      html += '<p class="plat-desc">' + plat.description + '</p>';
      html += '<div id="action-plat-' + plat.id + '">' + boutonHTML + '</div>';
      
      carte.innerHTML = html;
      grillePlats.appendChild(carte);
    }
  }

  if (platsTrouves === 0) {
    grillePlats.innerHTML = '<p style="text-align: center; width: 100%; color: var(--texte-doux); grid-column: 1 / -1; padding: 40px 0;">Aucun plat trouvé.</p>';
  }
}

function mettreAJourBoutonCarte(idPlat) {
  var conteneur = document.getElementById('action-plat-' + idPlat);
  if (!conteneur) return;
  var qte = getQuantite(idPlat);
  if (qte === 0) {
    conteneur.innerHTML = '<button class="btn-ajouter" onclick="ajouterAuPanier(' + idPlat + ')">Ajouter</button>';
  } else {
    conteneur.innerHTML = '<div class="controle-qte-menu"><button class="btn-qte-menu" onclick="modifierQteMenu(' + idPlat + ', -1)">-</button><span class="qte-menu-valeur">' + qte + '</span><button class="btn-qte-menu" onclick="modifierQteMenu(' + idPlat + ', 1)">+</button></div>';
  }
}

// --- LOGIQUE PANIER ---
function ajouterAuPanier(idPlat) {
  var platExiste = false;
  for (var i = 0; i < panier.length; i++) {
    if (panier[i].id === idPlat) {
      panier[i].quantite++;
      platExiste = true;
      break;
    }
  }
  if (!platExiste) {
    for (var j = 0; j < menuData.length; j++) {
      if (menuData[j].id === idPlat) {
        panier.push({ id: menuData[j].id, nom: menuData[j].nom, prix: menuData[j].prix, quantite: 1 });
        break;
      }
    }
  }
  sauvegarderPanier();
  mettreAJourInterfacePanier();
  mettreAJourBoutonCarte(idPlat);
}

function modifierQteMenu(idPlat, delta) {
  for (var i = 0; i < panier.length; i++) {
    if (panier[i].id === idPlat) {
      panier[i].quantite += delta;
      if (panier[i].quantite <= 0) {
        panier.splice(i, 1);
      }
      break;
    }
  }
  sauvegarderPanier();
  mettreAJourInterfacePanier();
  mettreAJourBoutonCarte(idPlat); 
}

function modifierQuantite(idPlat, delta) {
  modifierQteMenu(idPlat, delta);
  if (listePanierPage) afficherPagePanier();
}

function supprimerDuPanier(idPlat) {
  for (var i = 0; i < panier.length; i++) {
    if (panier[i].id === idPlat) {
      panier.splice(i, 1);
      break;
    }
  }
  sauvegarderPanier();
  mettreAJourInterfacePanier();
  mettreAJourBoutonCarte(idPlat);
  if (listePanierPage) afficherPagePanier();
}

// --- INTERFACE (MISE A JOUR VISUELLE) ---
function mettreAJourInterfacePanier() {
  var totalArticles = 0;
  for (var i = 0; i < panier.length; i++) totalArticles += panier[i].quantite;

  if (cartCount) cartCount.innerText = totalArticles;

  if (barrePanier) {
    if (totalArticles > 0) {
      barrePanier.classList.add('visible');
      document.body.classList.add('has-cart-bar');
      barrePanierQte.innerText = totalArticles + (totalArticles > 1 ? ' articles' : ' article');
      barrePanierTotal.innerText = calculerTotal() + ' F';
    } else {
      barrePanier.classList.remove('visible');
      document.body.classList.remove('has-cart-bar');
    }
  }
}

// --- AFFICHAGE DE LA PAGE PANIER.HTML ---
function afficherPagePanier() {
  if (!listePanierPage) return;
  if (panier.length === 0) {
    listePanierPage.innerHTML = '';
    formulaireCommande.style.display = 'none';
    panierVideMessage.style.display = 'block';
    return;
  }
  panierVideMessage.style.display = 'none';
  formulaireCommande.style.display = 'block';
  
  var html = '';
  for (var i = 0; i < panier.length; i++) {
    var item = panier[i];
    html += '<div class="item-panier"><div class="item-info"><div class="item-nom">' + item.nom + '</div><div class="item-prix-unit">' + item.prix + ' F / unité</div></div><div class="item-actions"><div class="controle-qte"><button class="btn-qte" onclick="modifierQuantite(' + item.id + ', -1)">-</button><span class="qte-valeur">' + item.quantite + '</span><button class="btn-qte" onclick="modifierQuantite(' + item.id + ', 1)">+</button></div><div class="item-total">' + (item.prix * item.quantite) + ' F</div><button class="btn-supprimer" onclick="supprimerDuPanier(' + item.id + ')">×</button></div></div>';
  }
  listePanierPage.innerHTML = html;
  totalPrixPage.innerText = calculerTotal() + ' F';
}

// --- GESTION DES MODES DE LIVRAISON ---
var modeSelectionne = "Livraison";
var modeBtns = document.querySelectorAll('.mode-btn');
var groupAdresse = document.getElementById('group-adresse');

if (modeBtns.length > 0) {
  for (var m = 0; m < modeBtns.length; m++) {
    modeBtns[m].addEventListener('click', function(e) {
      for (var k = 0; k < modeBtns.length; k++) modeBtns[k].classList.remove('active');
      e.target.classList.add('active');
      modeSelectionne = e.target.getAttribute('data-mode');
      if (groupAdresse) {
        groupAdresse.style.display = (modeSelectionne === 'Livraison') ? 'block' : 'none';
      }
    });
  }
}

// --- BOUTON WHATSAPP ---
if (btnWhatsApp) {
  btnWhatsApp.addEventListener('click', function() {
    var nom = document.getElementById('nom-client').value.trim();
    var adresse = document.getElementById('adresse-client').value.trim();
    var remarque = document.getElementById('remarque-client').value.trim();

    if (nom === "") { alert("Veuillez entrer votre nom."); return; }
    if (modeSelectionne === "Livraison" && adresse === "") { alert("Veuillez entrer votre adresse."); return; }

    var message = "NOUVELLE COMMANDE ATLAS\n\n";
    message += "Nom : " + nom + "\n";
    message += "Mode : " + modeSelectionne + "\n";
    if (modeSelectionne === "Livraison") message += "Adresse : " + adresse + "\n";
    if (remarque !== "") message += "Remarque : " + remarque + "\n";
    
    message += "\n-----------------------\n\n";
    
    for (var i = 0; i < panier.length; i++) {
      message += "- " + panier[i].quantite + " x " + panier[i].nom + " (" + (panier[i].prix * panier[i].quantite) + " F)\n";
    }
    
    message += "\n-----------------------\n\n";
    message += "TOTAL : " + calculerTotal() + " F\n\n";
    message += "(Merci de confirmer ma commande)";

    var lien = "https://wa.me/" + numeroWhatsApp + "?text=" + encodeURIComponent(message);
    window.location.href = lien;
  });
}

// --- LANCEMENT AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', function() {
  if (grillePlats) afficherPlats('Tout', '');
  mettreAJourInterfacePanier();
  if (listePanierPage) afficherPagePanier();
});

// --- EVENEMENTS MENU ---
if (rubanFiltres) {
  rubanFiltres.addEventListener('click', function(e) {
    if (e.target.classList.contains('pill')) {
      var pills = rubanFiltres.querySelectorAll('.pill');
      for (var i = 0; i < pills.length; i++) pills[i].classList.remove('active');
      e.target.classList.add('active');
      afficherPlats(e.target.getAttribute('data-categorie'), champRecherche ? champRecherche.value : '');
    }
  });
}

if (champRecherche) {
  champRecherche.addEventListener('input', function() {
    var catActive = rubanFiltres.querySelector('.pill.active');
    afficherPlats(catActive ? catActive.getAttribute('data-categorie') : 'Tout', champRecherche.value);
  });
}
