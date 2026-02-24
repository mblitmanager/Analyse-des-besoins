<script setup>
import AppLogo from '../components/AppLogo.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-50 font-outfit">
    <header class="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-blue-400 font-black italic text-xl"
        >
          <AppLogo />
        </div>
        
      </div>
      <p class="text-xs text-gray-400 font-semibold uppercase tracking-widest">
        Politique de confidentialité
      </p>
    </header>

    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-10 md:py-14">
      <div class="flex items-center justify-between gap-4 mb-6">
        <h1 class="text-3xl md:text-4xl font-extrabold heading-primary">
          Politique de confidentialité de notre plateforme
        </h1>
        <router-link
          to="/"
          class="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-brand-primary"
        >
          <span class="material-icons-outlined text-base">arrow_back</span>
          <span>Retour à l'accueil</span>
        </router-link>
      </div>

      <section class="space-y-6 text-sm leading-relaxed text-gray-700">
        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            1 – Propriété intellectuelle et contrefaçons
          </h2>
          <p>
            La plateforme et l’ensemble de ses éléments (textes, images, graphismes,
            logos, icônes, sons, logiciels, etc.) sont la propriété de la société ou
            font l’objet d’un droit d’utilisation. Toute reproduction, représentation,
            modification, publication ou adaptation de tout ou partie des éléments du
            site, quel que soit le moyen ou le procédé utilisé, est interdite sauf
            autorisation écrite préalable.
          </p>
          <p class="mt-2">
            Toute exploitation non autorisée du site ou de l’un quelconque des
            éléments qu’il contient sera considérée comme constitutive d’une
            contrefaçon et poursuivie conformément aux dispositions des articles
            L.335‑2 et suivants du Code de Propriété Intellectuelle.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            2 – Limitations de responsabilité
          </h2>
          <p>
            L’éditeur de la plateforme ne pourra être tenu responsable des dommages
            directs et indirects causés au matériel de l’utilisateur lors de l’accès
            au site, et résultant notamment de l’apparition d’un bug ou d’une
            incompatibilité. Il ne pourra pas davantage être tenu responsable des
            dommages indirects (tels qu’une perte de marché ou perte d’une chance)
            consécutifs à l’utilisation du site.
          </p>
          <p class="mt-2">
            Des espaces interactifs (formulaire de contact, etc.) sont à la
            disposition des utilisateurs. L’éditeur se réserve le droit de supprimer,
            sans mise en demeure préalable, tout contenu déposé dans cet espace qui
            contreviendrait à la législation applicable, en particulier aux
            dispositions relatives à la protection des données. Le cas échéant, il se
            réserve également la possibilité de mettre en cause la responsabilité
            civile et/ou pénale de l’utilisateur.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            3 – Gestion des données personnelles
          </h2>
          <p>
            Les données personnelles sont notamment protégées par la loi n° 78‑17 du
            6 janvier 1978 modifiée, la loi n° 2004‑801 du 6 août 2004, l’article
            L.226‑13 du Code pénal et le Règlement (UE) 2016/679 du 27 avril 2016
            (RGPD). À l’occasion de l’utilisation de la plateforme, peuvent être
            recueillies des informations relatives à l’URL de provenance, au
            fournisseur d’accès, à l’adresse IP de l’utilisateur, ainsi que les
            données qu’il renseigne dans les formulaires.
          </p>
          <p class="mt-2">
            Ces informations sont collectées uniquement pour permettre la fourniture
            des services proposés (gestion des comptes, suivi pédagogique,
            communication avec les équipes, etc.). L’utilisateur fournit ces
            informations en toute connaissance de cause, notamment lorsqu’il procède
            lui‑même à leur saisie. Il est alors précisé le caractère obligatoire ou
            facultatif des données demandées.
          </p>
          <p class="mt-2">
            Aucune information personnelle de l’utilisateur n’est publiée à son insu,
            échangée, transférée, cédée ou vendue à des tiers, en dehors des cas
            prévus par la loi ou dans le cadre d’un éventuel rachat de la société, le
            repreneur étant à son tour tenu aux mêmes obligations.
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            4 – Droits des utilisateurs
          </h2>
          <p>
            Conformément au RGPD et à la loi Informatique et Libertés, chaque
            utilisateur dispose d’un droit d’accès, de rectification, d’effacement,
            de limitation du traitement, d’opposition pour motifs légitimes et d’un
            droit à la portabilité de ses données personnelles. Il peut également
            définir des directives relatives au sort de ses données après son décès.
          </p>
          <p class="mt-2">
            Pour exercer ces droits, l’utilisateur adresse une demande écrite et
            signée, accompagnée d’une copie d’un titre d’identité, en précisant
            l’adresse à laquelle la réponse doit être envoyée. Il peut également
            introduire une réclamation auprès de la CNIL
            (<a
              href="https://www.cnil.fr/fr/adresser-une-plainte"
              target="_blank"
              rel="noopener noreferrer"
              class="text-brand-primary underline"
              >www.cnil.fr/fr/adresser-une-plainte</a
            >).
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            5 – Liens hypertextes et cookies
          </h2>
          <p>
            Le site peut contenir un certain nombre de liens hypertextes vers d’autres
            sites. L’éditeur n’a pas la possibilité de vérifier le contenu des sites
            ainsi visités et n’assume en conséquence aucune responsabilité à ce
            titre. La navigation sur le site est susceptible de provoquer
            l’installation de cookie(s) sur l’ordinateur de l’utilisateur, tels que
            décrits plus en détail dans la page « Respect de la vie privée ».
          </p>
        </div>

        <div>
          <h2 class="font-bold text-base heading-primary mb-1">
            6 – Droit applicable
          </h2>
          <p>
            Tout litige en relation avec l’utilisation de la plateforme est soumis au
            droit français. Il est fait attribution exclusive de juridiction aux
            tribunaux compétents du ressort du siège de l’éditeur.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap");

.font-outfit {
  font-family: "Outfit", sans-serif;
}
</style>

