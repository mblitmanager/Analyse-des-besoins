<script setup>
import SiteHeader from '../components/SiteHeader.vue';
import SiteFooter from '../components/SiteFooter.vue';
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F0F4F8] font-outfit">
    <SiteHeader />

    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-10 md:py-14">
      <div class="flex items-center justify-between gap-4 mb-10">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary">
          Mentions légales
        </h1>
        <router-link
          to="/"
          class="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-brand-primary transition-colors"
        >
          <span class="material-icons-outlined text-base">arrow_back</span>
          <span>Retour</span>
        </router-link>
      </div>

      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-white p-8 md:p-10">
        <section class="space-y-6 text-sm leading-relaxed text-gray-700">
        <div>
          <h2 class="font-bold text-base heading-primary mb-1">Éditeur</h2>
          <p>
            <strong>AOPIA, marque de NS CONSEIL</strong><br />
            519 408 140 RCS Bordeaux<br />
            8, rue Evariste Galois, 86130 Jaunay-Marigny<br />
            Tél. : 09 72 51 29 04
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            Directeur de la publication
          </h2>
          <p>Alexandre Florek</p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">Hébergeur</h2>
          <p>
            <strong>IONOS</strong><br />
            7, place de la Gare<br />
            BP 70109<br />
            57200 Sarreguemines Cedex
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            Profession réglementée
          </h2>
          <p>
            Récépissé de déclaration d’activité d’un prestataire de formation,
            déclaration d’activité de prestation de formation n°
            <strong>75860174486</strong> auprès du Préfet de la région
            Nouvelle-Aquitaine, Direction régionale des entreprises, de la
            concurrence, de la consommation, du travail et de l’emploi
            (DIRECCTE).
          </p>
        </div>

        <div class="space-y-3">
          <h2 class="font-bold text-base heading-primary mb-1">
            Conditions générales d’utilisation du site
          </h2>

          <h3 class="font-semibold text-sm heading-primary">
            I – Périmètre
          </h3>
          <p>
            Les présentes mentions légales s’appliquent à toute personne physique
            qui visite le site internet, qui utilise les applications mises à
            disposition et, d’une façon générale, pour tout évènement auquel la
            personne participe dans le cadre des services proposés par AOPIA.
          </p>

          <h3 class="font-semibold text-sm heading-primary">
            II – Informations contenues dans le site
          </h3>
          <p>
            Les informations fournies le sont à titre informatif. AOPIA ne saurait
            garantir l’exactitude, la complétude, l’actualité des informations
            diffusées sur le site. AOPIA met tout en œuvre pour offrir aux
            utilisateurs des informations et des outils disponibles et vérifiés,
            mais ne saurait être tenue pour responsable des erreurs, des omissions
            et/ou d’une absence de disponibilité des informations et des services.
          </p>
          <p>
            En conséquence, l’utilisateur reconnaît utiliser ces informations sous
            sa responsabilité exclusive. D’une manière générale, AOPIA ne pourra
            être tenue responsable de tous les dommages directs ou indirects
            résultant de l’utilisation de son site internet. Les sites extérieurs
            ayant un lien hypertexte avec le présent site ne sont pas sous son
            contrôle et AOPIA décline par conséquent toute responsabilité quant à
            leur contenu. L’utilisateur est seul responsable de leur utilisation.
          </p>

          <h3 class="font-semibold text-sm heading-primary">
            III – Modifications du contenu du site
          </h3>
          <p>
            AOPIA est propriétaire de son site internet et se réserve le droit
            d’en modifier le contenu à tout moment et sans préavis, sans pouvoir
            être tenue responsable des conséquences de telles modifications. En
            outre, AOPIA se réserve le droit d’interrompre ou de suspendre tout ou
            partie des fonctionnalités des sites et/ou de leur publication, à tout
            moment et sans préavis.
          </p>

          <h3 class="font-semibold text-sm heading-primary">IV – Cookies</h3>
          <p>
            Dans le cadre de l’utilisation des sites, des informations relatives à
            la navigation de l’utilisateur sont susceptibles d’être enregistrées
            dans des fichiers textes appelés « Cookies » installés sur le terminal
            de l’utilisateur. Ces cookies peuvent être techniques, de mesure
            d’audience ou publicitaires, conformément à la politique de cookies
            détaillée dans notre page « Respect de la vie privée ».
          </p>

          <h3 class="font-semibold text-sm heading-primary">
            V – Propriété intellectuelle
          </h3>
          <p>
            Toute la structure générale, ainsi que les informations au sens large,
            les logiciels, textes, images animées ou fixes, sons, savoir-faire,
            dessins, graphismes, marques, logos, noms de domaine et tout autre
            élément composant ces sites sont la propriété exclusive d’AOPIA, sous
            réserve des droits de tiers. Toute reproduction ou représentation sans
            autorisation est strictement interdite.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            VII – Conditions Générales de Vente
          </h2>
          <p>
            Toute commande passée auprès d’AOPIA implique l’adhésion entière et
            sans réserve du client aux Conditions Générales de Vente.
          </p>
        </div>
      </section>
    </div>
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped>

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>

