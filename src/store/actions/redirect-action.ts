/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { soapFetch } from '@zextras/carbonio-shell-ui';
import {
	RedirectMessageActionRequest,
	EmailAddresses,
	MessageSpecification
} from '../../types/soap/';

export type RedirectActionParameters = {
	id: string;
	e: EmailAddresses[];
};

export const redirectMessageAction = async ({ id, e }: MessageSpecification): Promise<any> => {
	const res = await soapFetch<RedirectMessageActionRequest, unknown>('BounceMsg', {
		_jsns: 'urn:zimbraMail',
		m: {
			id,
			e
		}
	});

	return res;
};
