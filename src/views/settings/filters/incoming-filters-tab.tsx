/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { getFiltermanager } from './parts/filter-manager';
import { MessageFilterTab } from './parts/message-filter-tab';
import { getIncomingFilters } from '../../../api/get-filters';
import { modifyFilterRulesSoapApi } from '../../../api/modify-filter-rules-soap-api';

export const IncomingFiltersTab = (): React.JSX.Element => {
	const filtersManagerComponent = useMemo(() => getFiltermanager(true), []);
	return (
		<MessageFilterTab
			saveFilters={modifyFilterRulesSoapApi}
			getFilters={getIncomingFilters}
			FiltersManagerComponent={filtersManagerComponent}
		/>
	);
};
