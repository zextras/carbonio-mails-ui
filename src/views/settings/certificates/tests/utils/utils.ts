/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse } from 'msw';

import { createAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { Certificate } from 'types/certificates/certificates';

export const createAPIInterceptorToGetPersonalCertificates = (res?: Certificate[]): void => {
	const response = [
		{
			id: 1,
			email: 'demo@demo.zextras.io',
			notBefore: 1731912030000,
			notAfter: 1763448030000,
			serial: '658338337491899729292740349401868759960',
			issuer:
				'1.2.840.113549.1.9.1=#161664686176616c4064657a6578747261732e696f,CN=demo@demo.zextras.io',
			selected: true
		},
		{
			id: 2,
			email: 'test@demo.zextras.io',
			notBefore: 1731916761000,
			notAfter: 1763452761000,
			serial: '1480328137258129208569996201492386552296034160',
			issuer:
				'1.2.840.113549.1.9.1=#161d64686176616c46979614064656d6f2e7a6578747261732e696f,CN=test@demo.zextras.io',
			selected: true
		}
	];
	createAPIInterceptor(
		'get',
		'/service/extension/encryption/smime/personal/list/',
		HttpResponse.json(res ?? response)
	);
};

export const createAPIInterceptorToGetRecipientsCertificates = (res?: Certificate[]): void => {
	const response = {
		list: [
			{
				id: 1,
				email: 'demo@demo.zextras.io',
				notBefore: 1731912030000,
				notAfter: 1763448030000,
				serial: '658338337491899729292740349401868759960',
				issuer:
					'1.2.840.113549.1.9.1=#161664686176616c4064657a6578747261732e696f,CN=demo@demo.zextras.io',
				selected: true
			},
			{
				id: 2,
				email: 'test@demo.zextras.io',
				notBefore: 1731916761000,
				notAfter: 1763452761000,
				serial: '1480328137258129208569996201492386552296034160',
				issuer:
					'1.2.840.113549.1.9.1=#161d64686176616c46979614064656d6f2e7a6578747261732e696f,CN=test@demo.zextras.io',
				selected: true
			}
		]
	};
	createAPIInterceptor(
		'get',
		'/service/extension/encryption/smime/recipient/list',
		HttpResponse.json(res ?? response)
	);
};
