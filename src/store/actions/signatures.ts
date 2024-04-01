/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { createAsyncThunk } from '@reduxjs/toolkit';
import { JSNS, soapFetch } from '@zextras/carbonio-shell-ui';
import { map, escape } from 'lodash';
import { useMemo } from 'react';

import { SignItemType } from '../../types';

export type GetSignaturesRequest = {
	_jsns: typeof JSNS.ACCOUNT;
};

export type GetSignaturesResponse = {
	signature: Array<SignItemType>;
	_jsns: typeof JSNS.ACCOUNT;
};

export const GetAllSignatures = (): Promise<GetSignaturesResponse> =>
	soapFetch('GetSignatures', {
		_jsns: 'urn:zimbraAccount'
	});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SignatureRequest = createAsyncThunk('SignatureRequest', async (data: any) => {
	const requests: any = {};
	const { itemsAdd, itemsEdit, itemsDelete, account, settingsObj } = data;
	
	const getSignatureFormat = (format: string): "text/html" | "text/plain" | undefined => {
		if (format == "html") return 'text/html';
		if (format == "text") return 'text/plain';
		return undefined;
	}

	const signatureFormat = getSignatureFormat(settingsObj.zimbraPrefComposeFormat);

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
				}'><content type="${signatureFormat}">${escape(
					sign.usedSign
				)}</content></signature></CreateSignatureRequest>`
		).join('');
	}
	if (itemsEdit?.length) {
		ItemsEditRequest = map(
			itemsEdit,
			(sign) => `<ModifySignatureRequest  xmlns="urn:zimbraAccount"> 
			<signature id='${sign.id}' name='${sign.label}'> 
				<content type="${signatureFormat}">${escape(sign.usedSign)}</content>
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
		console.log(response.Body.Fault.Reason.Text);
		throw new Error(response.Body.Fault.Reason.Text);
	}

	return { response };
});
