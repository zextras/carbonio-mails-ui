/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { getFiltermanager } from './parts/filter-manager';
import { MessageFilterTab } from './parts/message-filter-tab';
import { getOutgoingFilters } from '../../../api/get-filters';
import { modifyOutgoingFilterRules } from '../../../store/actions/modify-filter-rules';

export const OutgoingFiltersTab = (): React.JSX.Element => {
	const filtersManagerComponent = useMemo(() => getFiltermanager(false), []);
	return (
		<MessageFilterTab
			saveFilters={modifyOutgoingFilterRules}
			getFilters={getOutgoingFilters}
			FiltersManagerComponent={filtersManagerComponent}
		/>
	);
};
