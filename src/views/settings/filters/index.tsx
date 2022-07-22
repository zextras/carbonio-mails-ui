/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement, useMemo } from 'react';
import { Container, Text, Divider } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import FilterTabs from './parts/filter-tabs';
import Heading from '../components/settings-heading';
import { filtersSubSection } from '../subsections';

const FilterModule: FC = (): ReactElement => {
	const [t] = useTranslation();
	const sectionTitle = useMemo(() => filtersSubSection(t), [t]);
	return (
		<Container background="gray6" padding={{ horizontal: 'medium', bottom: 'large' }}>
			<Container
				orientation="horizontal"
				padding={{ horizontal: 'medium', top: 'medium' }}
				mainAllignment="space-between"
			>
				<Container width="50%" id={sectionTitle.id}>
					<Heading title={sectionTitle.label} size="medium" />
				</Container>
				<Container width="50%" crossAlignment="flex-end">
					<Text size="extrasmall">
						{t('filters.filter_note', 'Note: changes to filter rules are saved immediately')}
					</Text>
				</Container>
			</Container>
			<Divider />
			<Container padding={{ all: 'medium', bottom: 'small' }}>
				<FilterTabs t={t} />
			</Container>
		</Container>
	);
};

export default FilterModule;
