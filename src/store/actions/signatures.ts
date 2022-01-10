/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { soapFetch } from '@zextras/zapp-shell';
import { map } from 'lodash';

// export const GetAllSignatures = createAsyncThunk('GetSignatures', async () => {
// 	const result = await soapFetch('GetSignatures', {
// 		_jsns: 'urn:zimbraAccount'
// 	});
// 	return result;
// });

export const GetAllSignatures = async (): Promise<any> => {
	const result = await soapFetch('GetSignatures', {
		_jsns: 'urn:zimbraAccount'
	});
	return result;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SignatureRequest = createAsyncThunk('SignatureRequest', async (data: any) => {
	const requests: any = {};
	const { ItemsAdd, ItemsEdit, ItemsDelete, account } = data;
	let ItemsDeleteRequest = '';
	let ItemsAddRequest = '';
	let ItemsEditRequest = '';
	if (ItemsDelete?.length) {
		ItemsDeleteRequest = map(
			ItemsDelete,
			(sign) =>
				`<DeleteSignatureRequest xmlns="urn:zimbraAccount" requestId='${sign.index}'><signature id='${sign.id}'/></DeleteSignatureRequest>`
		).join('');
	}
	if (ItemsAdd?.length) {
		ItemsAddRequest = map(
			ItemsAdd,
			(sign) =>
				`<CreateSignatureRequest  xmlns="urn:zimbraAccount"><signature name='${sign.label}'><content type="text/html">${sign.description}</content></signature></CreateSignatureRequest>`
		).join('');
	}
	if (ItemsEdit?.length) {
		ItemsEditRequest = map(
			ItemsEdit,
			(sign) => `<ModifySignatureRequest  xmlns="urn:zimbraAccount"> 
			<signature id='${sign.id}' name='${sign.label}'> 
				<content type="text/html">${sign.description}</content>
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
	if (response.Body.Fault) {
		throw new Error(response.Body.Fault.Reason.Text);
	}

	return { response };
});
