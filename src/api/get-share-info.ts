/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { soapFetch } from '@zextras/carbonio-shell-ui';

export function getShareInfo(): Promise<{ share: any }> {
	return soapFetch('GetShareInfo', {
		_jsns: 'urn:zimbraAccount',
		includeSelf: 0
	});
}
