/* eslint-disable @typescript-eslint/no-use-before-define */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as hooks from '@zextras/carbonio-shell-ui';
import { ApiManager, legacyXmlSoapFetch } from '@zextras/carbonio-ui-soap-lib';

import { saveSettings } from 'views/settings/save-settings';

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
		const spyUpdateSettings = vi.spyOn(hooks, 'updateSettings');
		const spyUpdateAccount = vi.spyOn(hooks, 'updateAccount');
		vi.mocked(legacyXmlSoapFetch).mockResolvedValue(mockSoapResponse);

		await saveSettings(settingsToUpdate, APP_ID);

		// BatchRequest
		expect(legacyXmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining('<BatchRequest xmlns="urn:zimbra" onerror="stop">')
		);

		// ModifyPropertiesRequest
		expect(legacyXmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyPropertiesRequest xmlns="urn:zimbraAccount"><prop name="propKey" zimlet="appId">propValue</prop></ModifyPropertiesRequest>'
			)
		);

		// ModifyPrefsRequest
		expect(legacyXmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyPrefsRequest xmlns="urn:zimbraAccount"><pref name="zimbraPrefHtmlEditorDefaultFontFamily">comic sans ms, sans-serif</pref></ModifyPrefsRequest>'
			)
		);

		// ModifyWhiteBlackListRequest
		expect(legacyXmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyWhiteBlackListRequest xmlns="urn:zimbraAccount"><whiteList><addr>whitelist@example.com</addr></whiteList></ModifyWhiteBlackListRequest>'
			)
		);
		// ModifyIdentityRequest
		expect(legacyXmlSoapFetch).toHaveBeenCalledWith(
			'Batch',
			expect.stringContaining(
				'<ModifyIdentityRequest xmlns="urn:zimbraAccount" requestId="0"><identity id="identityId"><a name="identityKey">newValue</a></identity></ModifyIdentityRequest>'
			)
		);

		expect(spyUpdateSettings).toHaveBeenCalledWith(settingsToUpdate);

		expect(spyUpdateAccount).toHaveBeenCalledWith({
			identities: {
				identitiesMods: settingsToUpdate.identity,
				newIdentities: mockSoapResponse.CreateIdentityResponse.map((item) => item.identity[0])
			}
		});
	});

	it('should call the ApiManager to set the polling interval if its value is not undefined', async () => {
		vi.mocked(legacyXmlSoapFetch).mockResolvedValue(mockSoapResponse);

		const pollingSetting = '60s';
		const settings = {
			...settingsToUpdate,
			prefs: {
				...settingsToUpdate.prefs,
				zimbraPrefMailPollingInterval: pollingSetting
			}
		};

		const apiManagerInstance = ApiManager.getApiManager();

		await saveSettings(settings, APP_ID);
		expect(vi.mocked(apiManagerInstance.setPollingPreference)).toHaveBeenCalledWith(pollingSetting);
	});
});
