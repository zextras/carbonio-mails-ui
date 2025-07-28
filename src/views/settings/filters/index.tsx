/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';

import { Text, FormSection, FormSubSection } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { FilterTabs } from 'views/settings/filters/filter-tabs';
import { filtersSubSection } from 'views/settings/subsections';

const FilterModule: FC = (): ReactElement => {
	const sectionTitle = useMemo(() => filtersSubSection(), []);
	return (
		<FormSection label={sectionTitle.label} id={sectionTitle.id}>
			<FormSubSection>
				<Text>
					{t('filters.filter_note', 'Note: changes to filter rules are saved immediately')}
				</Text>
				<FilterTabs />
			</FormSubSection>
		</FormSection>
	);
};

export default FilterModule;
