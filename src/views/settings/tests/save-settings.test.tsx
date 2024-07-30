/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { updateAccount, updateSettings, xmlSoapFetch } from '@zextras/carbonio-shell-ui';
import { AppDependantExports } from '@zextras/carbonio-shell-ui/lib/boot/app/app-dependant-exports';

import { saveSettings } from '../save-settings';

jest.mock('@zextras/carbonio-shell-ui', () => ({
	xmlSoapFetch: jest.fn() as jest.MockedFunction<AppDependantExports['soapFetch']>,
	updateAccount: jest.fn(),
	updateSettings: jest.fn()
}));

const APP_ID = 'appId';

const settingsToUpdate = {
	props: { propKey: { app: APP_ID, value: 'propValue' } },
	prefs: {
		zimbraPrefHtmlEditorDefaultFontFamily: 'comic sans ms, sans-serif'
	},
	attrs: { amavisWhitelistSender: ['whitelist@example.com'] },
	identity: {
		createList: [{ prefs: { identityKey: 'identityValue' } }],
		modifyList: { identityId: { id: 'identityId', prefs: { identityKey: 'newValue' } } },
		deleteList: ['identityId']
	}
};

const mockSoapResponse = {
	CreateIdentityResponse: [
		{
			identity: [
				{
					id: 'identityId',
					name: 'testIdentity'
				}
			]
		}
	]
};

describe('saveSettings', () => {
	it('should generate the correct XML requests and call update functions', async () => {
		(xmlSoapFetch as jest.MockedFunction<AppDependantExports['soapFetch']>).mockResolvedValue(
			mockSoapResponse
		);

		await saveSettings(settingsToUpdate, APP_ID);

		// BatchRequest
		expect(xmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining('<BatchRequest xmlns="urn:zimbra" onerror="stop">')
		);

		// ModifyPropertiesRequest
		expect(xmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyPropertiesRequest xmlns="urn:zimbraAccount"><prop name="propKey" zimlet="appId">propValue</prop></ModifyPropertiesRequest>'
			)
		);

		// ModifyPrefsRequest
		expect(xmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyPrefsRequest xmlns="urn:zimbraAccount"><pref name="zimbraPrefHtmlEditorDefaultFontFamily">comic sans ms, sans-serif</pref></ModifyPrefsRequest>'
			)
		);

		// ModifyWhiteBlackListRequest
		expect(xmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyWhiteBlackListRequest xmlns="urn:zimbraAccount"><whiteList><addr>whitelist@example.com</addr></whiteList></ModifyWhiteBlackListRequest>'
			)
		);
		// ModifyIdentityRequest
		expect(xmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyIdentityRequest xmlns="urn:zimbraAccount" requestId="0"><identity id="identityId"><a name="identityKey">newValue</a></identity></ModifyIdentityRequest>'
			)
		);

		expect(updateSettings).toHaveBeenCalledWith(settingsToUpdate);

		expect(updateAccount).toHaveBeenCalledWith({
			identities: {
				identitiesMods: settingsToUpdate.identity,
				newIdentities: mockSoapResponse.CreateIdentityResponse.map((item) => item.identity[0])
			}
		});
	});
});
