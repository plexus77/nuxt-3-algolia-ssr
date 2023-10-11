<template>
    <div class="container mx-auto">
        <br>
        <ais-instant-search-ssr
            :search-client="algolia"
            index-name="instant_search"
            :routing="routing"
        >
            <ais-search-box placeholder="Product, brand, color, …"/>
            <br>
            <div class="grid grid-cols-4">
                <div class="lg:block mr-2 mt-3">
                    <ais-clear-refinements data-layout="desktop">
                        <template #resetLabel>
                            <div class="clear-filters">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="10"
                                    height="10"
                                    viewBox="0 0 11 11"
                                >
                                    <g fill="none" fill-rule="evenodd" opacity=".4">
                                        <path d="M0 0h11v11H0z" />
                                        <path
                                            fill="#000"
                                            fill-rule="nonzero"
                                            d="M8.26 2.75a3.896 3.896 0 1 0 1.102 3.262l.007-.056a.49.49 0 0 1 .485-.456c.253 0 .451.206 .437.457 0 0 .012-.109-.006.061a4.813 4.813 0 1 1-1.348-3.887v-.987a.458.458 0 1 1 .917.002v2.062a.459.459 0 0 1-.459.459H7.334a.458.458 0 1 1-.002-.917h.928z"
                                        />
                                    </g>
                                </svg>
                                Clear filters
                            </div>
                        </template>
                    </ais-clear-refinements>
                    <br>
                    <div class="container-body">
                        <ais-panel>
                            <template #header> Brands </template>

                            <template #default>
                                <ais-refinement-list
                                    attribute="brand"
                                    searchable
                                    searchable-placeholder="Search for brands…"
                                />
                            </template>
                        </ais-panel>
                        <br>
                        <ais-toggle-refinement attribute="free_shipping" label="Free Shipping">
                            <template v-slot="{ value, refine, createURL, sendEvent }">
                                <span class="toggle-slider">
                                    <input
                                        type="checkbox"
                                        class="toggle-checkbox"
                                        :checked="value.isRefined"
                                        @click="refine(value)"
                                    >
                                </span>
                                <a
                                    :href="createURL(value)"
                                    @click.prevent="refine(value)"
                                >
                                    Free Shipping
                                    ({{value.count}})
                                </a>
                            </template>
                        </ais-toggle-refinement>
                    </div>
                </div>
                <div class="col-span-3">
                    <div class="results">
                        <ais-stats class="hidden lg:block mb-4 mt-4">
                            <template v-slot="{ hitsPerPage, nbPages, nbHits, page }">
                                <span class="text-sm text-blue-800">Showing {{ getResultsShown(hitsPerPage, nbPages, nbHits, page) }} out of {{ nbHits }}</span>
                            </template>
                        </ais-stats>
                    </div>
                    <br>
                    <ais-hits>
                        <template v-slot="{ items }">
                            <div class="grid grid-cols-4 gap-4">
                                <div v-for="item in items" :key="item.objectID" class="grid-item">
                                    <div class="card">
                                        <div class="card-body">
                                            <img :src="item.image" alt="item image" />
                                            <h3 class="text-center mt-10">{{ item.name }}</h3>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </ais-hits>
                </div>
            </div>
            <br><br>
            <div class="flex justify-center">
                <ais-pagination/>
            </div>
        </ais-instant-search-ssr>
    </div>
</template>
<script async setup>
import { createServerRootMixin, AisInstantSearchSsr, AisSearchBox, AisCurrentRefinements, AisClearRefinements, AisMenuSelect, AisPanel, AisRefinementList, AisConfigure, AisHits, AisPagination, AisToggleRefinement, AisSortBy, AisStats } from 'vue-instantsearch/vue3/es'
import { renderToString } from 'vue/server-renderer'
import { connectSearchBox, connectPagination, connectStats, connectRefinementList, connectToggleRefinement } from 'instantsearch.js/es/connectors'
import { ref } from 'vue';
import { history as historyRouter } from 'instantsearch.js/es/lib/routers';
import { useRequestURL } from 'nuxt/app'

const algolia = useAlgoliaRef()
const indexName = 'instant_search'
const url = useRequestURL()
const routing = {
    router: historyRouter( {getLocation() {
        return url
    }})
};
const totalHits = ref(0)

// Setup Algolia SSR
const serverRootMixin = ref(
    createServerRootMixin({
        searchClient: algolia,
        indexName,
        routing: routing,
        insights: true,
    })
)
const {instantsearch} = serverRootMixin.value.data()

// Setup virtual widgets - without these the initial query will not work
const renderFn = (renderOptions, isFirstRender) => {}
const virtualSearchBox = connectSearchBox(renderFn)
const virtualPagination = connectPagination(renderFn)
const virtualStats = connectStats(renderFn)
const virtualRefinementList = connectRefinementList(renderFn)
const virtualToggleRefinement = connectToggleRefinement(renderFn)
instantsearch.addWidgets([
    virtualSearchBox(),
    virtualPagination(),
    virtualStats(),
    virtualRefinementList({attribute: 'brand'}),
    virtualToggleRefinement({attribute: 'free_shipping'})
])

// Provide SSR instance to all components
provide('$_ais_ssrInstantSearchInstance', instantsearch)

const {data: algoliaState, error} = useAsyncData('algolia-state', async () => {
    if (process.server) {
        const nuxtApp = useNuxtApp()
        nuxtApp.$algolia.transporter.requester = (
            await import('@algolia/requester-node-http').then((lib) => lib.default || lib)
        ).createNodeHttpRequester()
    }

    return await instantsearch.findResultsState({
        component: {
            $options: {
                components: {
                    AisInstantSearchSsr,
                    AisSearchBox,
                    AisCurrentRefinements,
                    AisClearRefinements,
                    AisMenuSelect,
                    AisRefinementList,
                    AisConfigure,
                    AisHits,
                    AisPagination,
                    AisPanel,
                    AisToggleRefinement,
                    AisSortBy,
                    AisStats
                },
                data() {
                    return {instantsearch};
                },
                provide: {$_ais_ssrInstantSearchInstance: instantsearch},
                render() {
                    return h(AisInstantSearchSsr, null, () => [
                        h('div', { class: 'container mx-auto' }, () => [
                            h('br'),
                            h(AisSearchBox, { placeholder: 'Product, brand, color, …' }),
                            h('br'),
                            h('div', { class: 'grid grid-cols-4' }, () => [
                                h('div', { class: 'lg:block mr-2 mt-3' }, () => [
                                    h(AisClearRefinements, { 'data-layout': 'desktop' }, () => [
                                        h('template', { slot: 'resetLabel' }, () => [
                                            h('div', { class: 'clear-filters' }, () => [
                                                h('svg', {
                                                    xmlns: 'http://www.w3.org/2000/svg',
                                                    width: '10',
                                                    height: '10',
                                                    viewBox: '0 0 11 11',
                                                }, () => [
                                                    h('g', { fill: 'none', 'fill-rule': 'evenodd', opacity: '.4' }, () => [
                                                        h('path', { d: 'M0 0h11v11H0z' }),
                                                        h('path', {
                                                            fill: '#000',
                                                            'fill-rule': 'nonzero',
                                                            d:
                                                                'M8.26 2.75a3.896 3.896 0 1 0 1.102 3.262l.007-.056a.49.49 0 0 1 .485-.456c.253 0 .451.206 .437.457 0 0 .012-.109-.006.061a4.813 4.813 0 1 1-1.348-3.887v-.987a.458.458 0 1 1 .917.002v2.062a.459.459 0 0 1-.459.459H7.334a.458.458 0 1 1-.002-.917h.928',
                                                        }),
                                                    ]),
                                                ]),
                                                'Clear filters',
                                            ]),
                                        ]),
                                    ]),
                                    h('br'),
                                    h('div', { class: 'container-body' }, () => [
                                        h(AisPanel, () => [
                                            h('template', { slot: 'header' }, 'Brands'),
                                            h('template', () => [
                                                h(AisRefinementList, {
                                                    attribute: 'brand',
                                                    searchable: true,
                                                    'searchable-placeholder': 'Search for brands…',
                                                }),
                                            ]),
                                        ]),
                                        h('br'),
                                        h(AisToggleRefinement, { attribute: 'free_shipping', label: 'Free Shipping' }, () => [
                                            h('template', { slotProps: { value, refine, createURL, sendEvent } }, () => [
                                                h('span', { class: 'toggle-slider' }, () => [
                                                    h('input', {
                                                        type: 'checkbox',
                                                        class: 'toggle-checkbox',
                                                        ':checked': value.isRefined,
                                                        '@click': 'refine(value)',
                                                    }),
                                                ]),
                                                h('a', { ':href': 'createURL(value)', '@click.prevent': 'refine(value)' }, () => [
                                                    `Free Shipping ({{value.count}})`,
                                                ]),
                                            ]),
                                        ]),
                                        h(AisToggleRefinement, null ,() => [{attribute: 'free_shipping'}])
                                    ]),
                                ]),
                                h('div', { class: 'col-span-3' }, () => [
                                    h('div', { class: 'results' }, () => [
                                        h(AisStats, { class: 'hidden lg:block mb-4 mt-4' }, () => [
                                            h('template', { slotProps: { hitsPerPage, nbPages, nbHits, page } }, () => [
                                                h('span', { class: 'text-sm text-blue-800' }, () => [
                                                    'Showing {{ getResultsShown(hitsPerPage, nbPages, nbHits, page) }} out of {{ nbHits }}',
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                    h('br'),
                                    h(AisHits, () => [
                                        h('template', { slotProps: { items } }, () => [
                                            h('div', { class: 'grid grid-cols-4 gap-4' }, () => [
                                                items.map((item) => h('div', { key: item.objectID, class: 'grid-item' }, () => [
                                                    h('div', { class: 'card' }, () => [
                                                        h('div', { class: 'card-body' }, () => [
                                                            h('img', { ':src': item.image, alt: 'item image' }),
                                                            h('h3', { class: 'text-center mt-10' }, item.name),
                                                        ]),
                                                    ]),
                                                ])),
                                            ]),
                                        ]),
                                    ]),
                                ]),
                            ]),
                            h('br'),
                            h('br'),
                            h('div', { class: 'flex justify-center' }, () => [h(AisPagination)]),
                        ]),
                    ]);
                }
            }
        },
        renderToString
    })
})

onBeforeMount(() => {
    // Use data loaded on the server to populate the search state
    if (algoliaState.value) {
        instantsearch.hydrate(algoliaState.value)
    }
})

const getResultsShown = (hitsPerPage, nbPages, nbHits, page) => {
    totalHits.value = nbHits
    if (page + 1 === nbPages) {
        return nbHits % hitsPerPage
    }

    return nbHits <= hitsPerPage ? nbHits : hitsPerPage
}
</script>
<style>
.card {
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    height: 100%;
    width: 100%;
    border-radius: 16px;
}

.results {
    display: flex;
    flex-grow: 1;
    align-items: center;
    justify-content: space-between;
    border-top: solid 1px #eaeaea;
    border-bottom: solid 1px #eaeaea;
}
.card img {
    max-width: 100%;
    max-height: 75%;
    object-fit: contain;
    object-position: center;
}

.clear-filters {
    display: flex;
    align-items: center;
    gap: 10px;
}

.clear-filters svg {
    width: 20px;
    height: 20px;
}
.toggle-slider {
    flex-direction: row-reverse;
}

.toggle-checkbox {
    order: -1;
    background-color: gray(255);
    background-position: 50%;
    border: 1px solid currentcolor;
    border-radius: 3px;
    box-shadow: inset 0 1px 4px 0 rgba(119, 122, 175, 0.4);
    color: #d6d6e7;
    cursor: inherit;
    height: 1rem;
    margin: 0 0.5rem 0 0;
    min-width: 1rem;
}
</style>
