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
          Respect de la vie privée
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
          <h2 class="font-bold text-base heading-primary mb-1">
            Pourquoi utilisons-nous des cookies&nbsp;?
          </h2>
          <p>
            Un cookie est un petit fichier texte qui est enregistré sur votre
            ordinateur et qui, au fil des visites, est récupéré sur votre
            ordinateur ou votre appareil portable. Nous en utilisons deux types&nbsp;:
            les cookies permanents et les cookies de session. Un cookie permanent
            nous permet de vous identifier en tant qu’utilisateur existant pour que
            vous puissiez revenir facilement sur notre site. Une fois que vous êtes
            connecté, un cookie permanent demeure dans votre navigateur et sera lu.
            Les cookies de session ne durent que le temps de la session (en général
            la visite actuelle sur le site internet ou une session de navigateur).
          </p>
          <p>
            Les cookies déposés sur votre ordinateur, votre tablette ou votre mobile
            nous permettent de reconnaître votre navigateur lorsque vous vous
            connectez à notre site. Soucieux des services que nous vous proposons,
            nous émettons des cookies afin&nbsp;:
          </p>
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>
              d’établir des statistiques de fréquentation (nombre de visites, de
              pages vues, etc.) afin de suivre et d’améliorer la qualité de nos
              services&nbsp;;
            </li>
            <li>
              d’adapter la présentation de notre site aux préférences d’affichage de
              votre support.
            </li>
          </ul>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            Gestion des cookies dans votre navigateur
          </h2>
          <p>
            Vous pouvez choisir de désactiver les cookies dans votre navigateur à
            tout moment en suivant les instructions fournies dans les fichiers d’aide
            de votre navigateur. Vous pouvez également paramétrer vos cookies
            directement dans les réglages de votre navigateur&nbsp;:
          </p>
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>
              Google Chrome&nbsp;:
              <a
                href="https://support.google.com/chrome/answer/95647?hl=fr"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-primary underline"
              >
                support.google.com/chrome/answer/95647
              </a>
            </li>
            <li>
              Internet Explorer&nbsp;:
              <a
                href="https://support.microsoft.com/fr-fr/topic/supprimer-et-g%C3%A9rer-les-cookies-168dab11-0753-043d-7c16-ede5947fc64d"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-primary underline"
              >
                support.microsoft.com/fr-fr/topic/supprimer-et-g%C3%A9rer-les-cookies
              </a>
            </li>
            <li>
              Mozilla Firefox&nbsp;:
              <a
                href="https://support.mozilla.org/fr/kb/activer-desactiver-cookies"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-primary underline"
              >
                support.mozilla.org/fr/kb/activer-desactiver-cookies
              </a>
            </li>
            <li>
              Safari&nbsp;:
              <a
                href="https://www.apple.com/fr/privacy/use-of-cookies/"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-primary underline"
              >
                apple.com/fr/privacy/use-of-cookies
              </a>
            </li>
          </ul>
          <p class="mt-2">
            Nous attirons votre attention sur le fait que la désactivation des
            cookies peut réduire ou empêcher l’accessibilité à tout ou partie de
            certaines fonctions du site. La durée de conservation des cookies de
            mesure d’audience est de treize mois. Conformément aux recommandations
            de la CNIL, à l’issue du treizième mois les données de mesure d’audience
            sont détruites.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            Données personnelles collectées et finalités
          </h2>
          <p>
            Lorsque vous nous transmettez vos coordonnées, nous pouvons mener des
            actions nous conduisant à vous contacter afin de recueillir des
            informations relatives à votre projet professionnel, votre parcours de
            formation, vos modalités de financement, vos motivations et la date
            estimée de démarrage. Ces données sont utilisées pour l’enregistrement,
            la consultation, l’utilisation, la complétion, l’extraction et la
            transmission afin de promouvoir les parcours de nos bénéficiaires.
          </p>
          <p class="mt-2">
            La totalité de vos données personnelles est archivée à l’issue des
            périodes suivantes&nbsp;:
          </p>
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>3 ans après n’avoir eu aucune interaction avec nos sollicitations marketing&nbsp;;</li>
            <li>
              5 ans après votre dernière utilisation de notre plateforme de formation
              à distance pour l’historique de votre parcours de formation&nbsp;;
            </li>
            <li>
              10 ans après votre dernière utilisation de notre plateforme pour
              l’historique de vos examens de certification professionnelle.
            </li>
          </ul>
          <p class="mt-2">
            Vos données personnelles seront supprimées sur simple demande de votre
            part. Dans ce cadre, nous conservons certaines informations sous une
            forme anonymisée ou agrégée, notamment celles relatives à la navigation
            et à l’utilisation des services proposés, dans une finalité
            d’optimisation et d’amélioration de nos services.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            Vos droits sur vos données
          </h2>
          <p>
            Conformément à la réglementation en vigueur, vous disposez sur vos
            données personnelles des droits suivants&nbsp;:
          </p>
          <ul class="list-disc list-inside mt-2 space-y-1">
            <li>droit d’accès et de rectification ;</li>
            <li>droit de verrouillage ou de suppression des données ;</li>
            <li>droit de retirer votre consentement ;</li>
            <li>droit d’opposition pour des motifs légitimes ;</li>
            <li>droit à la portabilité des données ;</li>
            <li>
              droit de définir des directives relatives au sort de vos données après
              votre décès.
            </li>
          </ul>
          <p class="mt-2">
            Les parents qui pensent que nous avons involontairement collecté des
            données personnelles sur leur enfant mineur doivent nous contacter afin
            que nous puissions supprimer ces informations.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            Informations complémentaires et réclamations
          </h2>
          <p>
            Si vous souhaitez de plus amples informations sur la protection des
            données personnelles ou introduire une réclamation, vous pouvez
            contacter la Commission nationale de l’informatique et des libertés
            (CNIL)&nbsp;:
          </p>
          <p class="mt-2">
            3 place de Fontenoy TSA 80715 75334 PARIS CEDEX 07<br />
            Téléphone : +33 (0)1 53 73 22 22<br />
            Site : 
            <a
              href="https://www.cnil.fr/fr/adresser-une-plainte"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-primary underline"
            >
              www.cnil.fr/fr/adresser-une-plainte
            </a>
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

