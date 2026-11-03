/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { JSNS } from '@zextras/carbonio-shell-ui';
import { GenericSoapApiError } from '@zextras/carbonio-ui-commons';
import { soapFetchV2 } from '@zextras/carbonio-ui-soap-lib';
import { map, escape } from 'lodash';

import { Signature } from 'types/settings';

export type GetSignaturesRequest = {
	_jsns: typeof JSNS.account;
};

/** The server leaves signature out when the account has none */
export type GetSignaturesSoapResponse = {
	signature?: Array<Signature>;
	_jsns: typeof JSNS.account;
};

export type GetSignaturesResponse = {
	signature: Array<Signature>;
	_jsns: typeof JSNS.account;
};

export async function GetSignaturesSoapApi(): Promise<GetSignaturesResponse> {
	const { Body } = await soapFetchV2<
		GetSignaturesRequest,
		{ GetSignaturesResponse: GetSignaturesSoapResponse }
	>('GetSignatures', {
		_jsns: 'urn:zimbraAccount'
	});
	if ('Fault' in Body) {
		throw new GenericSoapApiError(Body.Fault);
	}
	const response = Body.GetSignaturesResponse;
	return { ...response, signature: response.signature ?? [] };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function signatureRequest(data: any): Promise<{ response: any }> {
	const requests: any = {};
	const { itemsAdd, itemsEdit, itemsDelete, account } = data;
	let ItemsDeleteRequest = '';
	let ItemsAddRequest = '';
	let ItemsEditRequest = '';
	if (itemsDelete?.length) {
		ItemsDeleteRequest = map(
			itemsDelete,
			(sign) =>
				`<DeleteSignatureRequest xmlns="urn:zimbraAccount" requestId='${sign.index}'><signature id='${sign.id}'/></DeleteSignatureRequest>`
		).join('');
	}
	if (itemsAdd?.length) {
		ItemsAddRequest = map(
			itemsAdd,
			(sign) =>
				`<CreateSignatureRequest  xmlns="urn:zimbraAccount"><signature name='${
					sign.label
				}'><content type="text/html">${escape(
					sign.description
				)}</content></signature></CreateSignatureRequest>`
		).join('');
	}
	if (itemsEdit?.length) {
		ItemsEditRequest = map(
			itemsEdit,
			(sign) => `<ModifySignatureRequest  xmlns="urn:zimbraAccount"> 
			<signature id='${sign.id}' name='${sign.label}'> 
				<content type="text/html">${escape(sign.description)}</content>
			</signature>
		</ModifySignatureRequest>`
		).join('');
	}

	requests.SignatureRequest = `<BatchRequest xmlns="urn:zimbra" onerror="stop">
        ${ItemsDeleteRequest}    
        ${ItemsAddRequest}    
        ${ItemsEditRequest}    
        </BatchRequest>`;

	const res = await fetch('/service/soap/BatchRequest', {
		method: 'POST',
		headers: {
			'content-type': 'application/soap+xml'
		},
		body: `<?xml version="1.0" encoding="utf-8"?>
			<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
				<soap:Header>
					<context xmlns="urn:zimbra">
						<account by="name">${account.name}</account>
						<format type="js"/>
					</context>
				</soap:Header>
				<soap:Body>
					${requests.SignatureRequest ?? ''}				
				</soap:Body>
			</soap:Envelope>
		`
	});
	const response = await res.json();
	// in a BatchResponse, Fault is an array: one fault for each failed request
	const fault = response.Body.BatchResponse.Fault?.[0];
	if (fault) {
		throw new Error(fault.Reason?.Text);
	}

	return { response };
}

type CreatedSignatures = {
	Body?: {
		BatchResponse?: {
			CreateSignatureResponse?: Array<{ signature: Array<{ id: string; name: string }> }>;
		};
	};
};

export const getCreatedSignatureId = (
	response: CreatedSignatures,
	name: string
): string | undefined =>
	(response.Body?.BatchResponse?.CreateSignatureResponse ?? [])
		.flatMap(({ signature }) => signature)
		.find((signature) => signature.name === name)?.id;
