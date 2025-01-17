/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useMemo } from 'react';

import { getFilterActions } from './parts/filter-actions';
import { MessageFilterTab } from './parts/message-filter-tab';
import { getIncomingFilters } from '../../../api/get-filters';
import { modifyFilterRules } from '../../../store/actions/modify-filter-rules';

export const IncomingFiltersTab = (): React.JSX.Element => {
	const filterActionsComponent = useMemo(() => getFilterActions(true), []);
	return (
		<MessageFilterTab
			saveFilters={modifyFilterRules}
			getFilters={getIncomingFilters}
			FilterActionsComponent={filterActionsComponent}
		/>
	);
};
