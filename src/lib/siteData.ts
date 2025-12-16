export const siteMeta = {
	title: "Society for the Innocents Web Radio & Community Site",
	tagline: "Radio for the Innocents",
	description:
		"Streaming Christian music, local news, sports, and events—SFTI Radio connects communities while supporting The Society for the Innocents.",
	description_short:
		"The Society for the Innocents provide hope, help, and healing to expectant mothers in crisis.",
	url: "https://www.sfti.net/",
	author: "Cobalt Web Technologies",
};

export const seoMeta = {
	title: siteMeta.title,
	description: siteMeta.description,
	structuredData: {
		"@context": "https://schema.org",
		"@type": "WebPage",
		inLanguage: "en-US",
		"@id": siteMeta.url,
		url: siteMeta.url,
		name: siteMeta.title,
		description: siteMeta.description,
		isPartOf: {
			"@type": "WebSite",
			url: siteMeta.url,
			name: siteMeta.title,
			description: siteMeta.description,
		},
	},
};

export const openGraph = {
	locale: "en_US",
	type: "website",
	url: siteMeta.url,
	title: `${siteMeta.title}`,
	description: siteMeta.description,
};
