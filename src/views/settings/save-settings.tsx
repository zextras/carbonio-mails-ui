/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { updateAccount, updateSettings, xmlSoapFetch } from '@zextras/carbonio-shell-ui';
import { EditSettingsBatchResponse } from '@zextras/carbonio-shell-ui/lib/network/edit-settings';
import type { IdentityMods, Mods, PropsMods } from '@zextras/carbonio-shell-ui/lib/types/network';
import { isArray, map } from 'lodash';

import { MAIL_APP_ID } from '../../constants';

export type AttrsMods = Record<string, unknown>;

type MailMods = Mods & {
	attrs?: AttrsMods;
};

export type SaveSettingsResponse = Pick<
	EditSettingsBatchResponse,
	| 'ModifyPropertiesResponse'
	| 'ModifyPrefsResponse'
	| 'ModifyIdentityResponse'
	| 'CreateIdentityResponse'
>;

function getRequestForProps(props: PropsMods | undefined, appId: string): string {
	return props
		? `<ModifyPropertiesRequest xmlns="urn:zimbraAccount">${map(
				props,
				(prop, key) => `<prop name="${key}" zimlet="${prop.app ?? appId}">${prop.value}</prop>`
			)}</ModifyPropertiesRequest>`
		: '';
}

function getRequestForAmavisSendersListAttrs(attrs: AttrsMods | undefined): string {
	return attrs?.amavisWhitelistSender || attrs?.amavisBlacklistSender
		? `<ModifyWhiteBlackListRequest xmlns="urn:zimbraAccount">${
				attrs?.amavisWhitelistSender && isArray(attrs?.amavisWhitelistSender)
					? `<whiteList>${attrs?.amavisWhitelistSender
							.map((email) => `<addr>${email}</addr>`)
							.join('')}</whiteList>`
					: ''
			}${
				attrs?.amavisBlacklistSender && isArray(attrs?.amavisBlacklistSender)
					? `<blackList>${attrs?.amavisBlacklistSender
							.map((email) => `<addr>${email}</addr>`)
							.join('')}</blackList>`
					: ''
			}</ModifyWhiteBlackListRequest>`
		: '';
}

function getRequestForIdentities(identity: IdentityMods | undefined): string {
	return `${
		identity?.modifyList
			? map(
					identity.modifyList,
					(item) =>
						`<ModifyIdentityRequest xmlns="urn:zimbraAccount" requestId="0"><identity id="${
							item.id
						}">${map(item.prefs, (value, key) => `<a name="${key}">${value}</a>`).join(
							''
						)}</identity></ModifyIdentityRequest>`
				).join('')
			: ''
	}${
		identity?.deleteList
			? map(
					identity.deleteList,
					(item) =>
						`<DeleteIdentityRequest xmlns="urn:zimbraAccount" requestId="0"><identity id="${item}"/></DeleteIdentityRequest>`
				).join('')
			: ''
	}${
		identity?.createList
			? map(
					identity.createList,
					(item, index) =>
						`<CreateIdentityRequest xmlns="urn:zimbraAccount" requestId="${index}"><identity name="${item.prefs.zimbraPrefIdentityName}"><a name="zimbraPrefIdentityName">${item.prefs.zimbraPrefIdentityName}</a><a name="zimbraPrefFromDisplay">${item.prefs.zimbraPrefFromDisplay}</a><a name="zimbraPrefFromAddress">${item.prefs.zimbraPrefFromAddress}</a><a name="zimbraPrefFromAddressType">sendAs</a><a name="zimbraPrefReplyToEnabled">${item.prefs.zimbraPrefReplyToEnabled}</a><a name="zimbraPrefReplyToDisplay">${item.prefs.zimbraPrefReplyToDisplay}</a><a name="zimbraPrefReplyToAddress">${item.prefs.zimbraPrefReplyToAddress}</a><a name="zimbraPrefDefaultSignatureId">${item.prefs.zimbraPrefDefaultSignatureId}</a><a name="zimbraPrefForwardReplySignatureId">${item.prefs.zimbraPrefForwardReplySignatureId}</a><a name="zimbraPrefWhenSentToEnabled">${item.prefs.zimbraPrefWhenSentToEnabled}</a><a name="zimbraPrefWhenInFoldersEnabled">${item.prefs.zimbraPrefWhenInFoldersEnabled}</a></identity></CreateIdentityRequest>`
				).join('')
			: ''
	}`;
}

export const saveSettings = (mods: MailMods, appId = MAIL_APP_ID): Promise<SaveSettingsResponse> =>
	xmlSoapFetch<string, SaveSettingsResponse>(
		'Batch',
		`<BatchRequest xmlns="urn:zimbra" onerror="stop">
				${getRequestForProps(mods.props, appId)}
				${getRequestForAmavisSendersListAttrs(mods.attrs)}
				${getRequestForIdentities(mods.identity)}
		</BatchRequest>`
	).then((resp) => {
		updateSettings(mods);
		updateAccount(mods, resp);
		return resp;
	});
