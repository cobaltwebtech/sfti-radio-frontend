export const siteMeta = {
	title: "SFTI Radio",
	tagline: "Radio for the Innocents",
	description:
		"We offer hope to expectant mothers in crisis, help through long-term support and care, and healing through sacred remembrance of unborn lives.",
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
	description:
		"We offer hope to expectant mothers in crisis, help through long-term support and care, and healing through sacred remembrance of unborn lives.",
};
