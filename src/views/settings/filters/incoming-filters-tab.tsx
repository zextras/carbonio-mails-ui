/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { getFilterActions } from './parts/filter-actions';
import { MessageFilterTab } from './parts/message-filter-tab';
import { getIncomingFilters } from '../../../store/actions/get-incoming-filters';
import { modifyFilterRules } from '../../../store/actions/modify-filter-rules';

export const IncomingFiltersTab = (): React.JSX.Element => (
	<MessageFilterTab
		getFilters={getIncomingFilters}
		FilterActionsComponent={getFilterActions(true, modifyFilterRules)}
	/>
);
