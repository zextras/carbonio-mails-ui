/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { JSNS } from '@zextras/carbonio-shell-ui';

import { createSoapAPIInterceptor } from '@zextras/carbonio-ui-commons';
import {
	GetSignaturesRequest,
	GetSignaturesResponse
} from '../../../../api/get-signatures-soap-api';
import { SignItemType } from '../../../../types';

export const handleGetSignaturesRequest = (signatures: Array<SignItemType>): void => {
	createSoapAPIInterceptor<GetSignaturesRequest, GetSignaturesResponse>('GetSignatures', {
		signature: signatures,
		_jsns: JSNS.account
	});
};
