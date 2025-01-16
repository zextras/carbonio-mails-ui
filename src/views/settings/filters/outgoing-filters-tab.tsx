/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { getFilterActions } from './parts/filter-actions';
import { MessageFilterTab } from './parts/message-filter-tab';
import { getOutgoingFilters } from '../../../api/get-filters';
import {
	modifyFilterRules,
	modifyOutgoingFilterRules
} from '../../../store/actions/modify-filter-rules';

export const OutgoingFiltersTab = (): React.JSX.Element => (
	<MessageFilterTab
		saveFilters={modifyFilterRules}
		getFilters={getOutgoingFilters}
		FilterActionsComponent={getFilterActions(false, modifyOutgoingFilterRules)}
	/>
);
