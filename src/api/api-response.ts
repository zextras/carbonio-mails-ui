/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ErrorSoapBodyResponse, SoapBody } from '@zextras/carbonio-ui-soap-lib';

export const isFaultResponse = (
	response: SoapBody<unknown> | ErrorSoapBodyResponse
): response is ErrorSoapBodyResponse => 'Fault' in response;
