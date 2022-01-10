/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export const EmptyListMessages = (t) => [
	{
		title: t('displayer.search_title1', 'Start another search'),
		description: t(
			'displayer.search_description1',
			'Or select “Advanced Filters” to refine your search.'
		)
	},
	{
		title: t('displayer.search_title2', 'We’re sorry but there are no results for your search'),
		description: t('displayer.search_description2', 'Try to start another search.')
	},
	{
		title: t('displayer.search_title3', 'There are no results for your search.'),
		description: t(
			'displayer.search_description3',
			'Check the spelling and the filters options or try with another keyword.'
		)
	}
];

export const EmptyFieldMessages = (t) => [
	{
		title: t(
			'displayer.search_title4',
			'Select one or more results to perform actions or display details.'
		),
		description: ''
	}
];
