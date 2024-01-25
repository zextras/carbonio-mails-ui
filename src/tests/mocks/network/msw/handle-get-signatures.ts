/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapResponse, JSNS, SoapResponse } from '@zextras/carbonio-shell-ui';
import { ResponseResolver, rest, RestContext, RestRequest } from 'msw';

import { getSetupServer } from '../../../../carbonio-ui-commons/test/jest-setup';
import { buildSoapResponse } from '../../../../carbonio-ui-commons/test/mocks/utils/soap';
import { GetSignaturesRequest, GetSignaturesResponse } from '../../../../store/actions/signatures';
import { SignItemType } from '../../../../types';

type GetSignatures = ResponseResolver<
	RestRequest<{ Body: { GetSignaturesRequest: GetSignaturesRequest } }>,
	RestContext,
	SoapResponse<GetSignaturesResponse>
>;
export const handleGetSignaturesRequest = (
	signatures: Array<SignItemType>,
	error?: string
): jest.Mock<ReturnType<GetSignatures>, Parameters<GetSignatures>> => {
	const handler = jest.fn<ReturnType<GetSignatures>, Parameters<GetSignatures>>((req, res, ctx) => {
		if (error) {
			return res(
				ctx.json<ErrorSoapResponse>({
					Header: {
						context: {}
					},
					Body: {
						Fault: {
							Reason: { Text: error },
							Detail: {
								Error: { Code: '', Detail: error }
							}
						}
					}
				})
			);
		}

		return res(
			ctx.json(
				buildSoapResponse<GetSignaturesResponse>({
					GetSignaturesResponse: {
						signature: signatures,
						_jsns: JSNS.ACCOUNT
					}
				})
			)
		);
	});
	getSetupServer().use(
		rest.post<
			{ Body: { GetSignaturesRequest: GetSignaturesRequest } },
			never,
			SoapResponse<GetSignaturesResponse>
		>('/service/soap/GetSignaturesRequest', handler)
	);

	return handler;
};
