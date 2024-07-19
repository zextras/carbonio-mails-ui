/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { ErrorSoapBodyResponse, soapFetch } from '@zextras/carbonio-shell-ui';

/**
 * Describes the portion of the SOAP request that
 * contains the list of the messages id on which
 * the filters will be run
 */
export type ApplyFilterRulesSoapMessagesCriteria = {
	ids: string;
};

/**
 * Describes the portion of the SOAP request that
 * contains the query to search the messages which
 * the filters will be run
 */
export type ApplyFilterRulesSoapQueryCriteria = {
	_content: string;
};

/**
 * Describes the SOAP request for the ApplyFilterRules API
 */
export type ApplyFilterRulesSoapRequest = {
	filterRules: Array<{ filterRule: { name: string } }>;
	m?: ApplyFilterRulesSoapMessagesCriteria;
	query?: ApplyFilterRulesSoapQueryCriteria;
	_jsns: string;
};

/**
 * Describes the possible responses from the API
 */
export type ApplyFilterRulesSoapResponse =
	| {
			m?: Array<{
				ids: string;
			}>;
	  }
	| ErrorSoapBodyResponse;

/**
 * Describes the input params of the applyFilterRules function
 */
export type ApplyFilterRulesParams = {
	ruleName: string;
	messagesId?: Array<string>;
	foldersId?: Array<string>;
};

/**
 * Describes the output result of the applyFilterRules function
 */
export type ApplyFilterRulesResult = {
	messagesId: Array<string>;
};

/**
 * Compose the messages id criteria portion for the SOAP request
 * @param messagesId
 */
export const composeMessagesIdSoapCriteria = (
	messagesId: Array<string> | undefined
): ApplyFilterRulesSoapMessagesCriteria | undefined => {
	if (!messagesId || !messagesId.length) {
		return undefined;
	}

	return {
		ids: messagesId.join(',')
	};
};

/**
 * Compose the folders id criteria portion for the SOAP request
 * @param messagesId
 */
export const composeFoldersIdSoapCriteria = (
	foldersId: Array<string> | undefined
): ApplyFilterRulesSoapQueryCriteria | undefined => {
	if (!foldersId || !foldersId.length) {
		return undefined;
	}

	const inCriteriaArray = foldersId.map((folderId): string => `inid:"${folderId}"`);

	return {
		_content: `(${inCriteriaArray.join(' OR ')})`
	};
};

/**
 * Tells if the given response contains an error
 * @param response
 */
const isSoapError = (response: ApplyFilterRulesSoapResponse): response is ErrorSoapBodyResponse =>
	'Fault' in response;

/**
 * Returns, as an array, the list of messages id returned by the API
 */
export const extractMessagesIdFromSoapResponse = (
	response: ApplyFilterRulesSoapResponse
): Array<string> => {
	if (!response || isSoapError(response) || !response.m?.[0].ids) {
		return [];
	}

	return response.m[0].ids.split(',');
};

/**
 * Invokes the ApplyFilterRules API function for the given rule.
 * The messages id list and the folders id list are mutually exclusive since the API cannot accept both of them.
 * If both are specified, only the folders id is considered
 *
 * @param ruleName
 * @param messagesId
 * @param foldersId
 */
export const applyFilterRules = async ({
	ruleName,
	messagesId,
	foldersId
}: ApplyFilterRulesParams): Promise<ApplyFilterRulesResult> => {
	const folderCriteria = composeFoldersIdSoapCriteria(foldersId);
	const messagesCriteria =
		folderCriteria === undefined ? composeMessagesIdSoapCriteria(messagesId) : undefined;
	try {
		const soapResult = await soapFetch<ApplyFilterRulesSoapRequest, ApplyFilterRulesSoapResponse>(
			'ApplyFilterRules',
			{
				filterRules: [
					{
						filterRule: {
							name: ruleName
						}
					}
				],
				...(messagesCriteria && { m: messagesCriteria }),
				...(folderCriteria && { query: folderCriteria }),
				_jsns: 'urn:zimbraMail'
			}
		);

		if (isSoapError(soapResult)) {
			return Promise.reject(soapResult.Fault.Reason.Text);
		}

		const ids = extractMessagesIdFromSoapResponse(soapResult);
		return Promise.resolve<ApplyFilterRulesResult>({ messagesId: ids });
	} catch (err) {
		return Promise.reject(new Error(''));
	}
};
