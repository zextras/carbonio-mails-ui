/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

import type { FilterRules } from '../../types';

export async function getOutgoingFilters(): Promise<{ filterRules: FilterRules }> {
	const { filterRules } = (await soapFetch('GetOutgoingFilterRules', {
		_jsns: 'urn:zimbraMail'
	})) as { filterRules: FilterRules };
	return { filterRules };
}
