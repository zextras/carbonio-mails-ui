/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { Container, FormSection } from '@zextras/carbonio-design-system';
import {
	AccountSettings,
	IdentityAttrs,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeaderProps,
	t,
	updateAccount,
	useUserAccount,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { cloneDeep, filter, find, isEmpty, isEqual, map, reduce, remove, unescape } from 'lodash';

import { differenceIdentities, differenceObject, getPropsDiff } from './components/utils';
import ComposeMessage from './compose-msg-settings';
import DisplayMessagesSettings from './displaying-messages-settings';
import FilterModule from './filters';
import { useSignatureSettings } from './hooks/use-signature-settings';
import ReceivingMessagesSettings from './receiving-messages-settings';
import { RecoverMessages } from './recover-messages';
import { saveSettings } from './save-settings';
import { SendersList, getList } from './senders-list';
import SignatureSettings from './signature-settings';
import TrusteeAddresses from './trustee-addresses';
import { useUpdateView } from '../../carbonio-ui-commons/hooks/use-update-view';
import { TIMEOUTS } from '../../constants';
import { NO_SIGNATURE_ID } from '../../helpers/signatures';
import { useAppDispatch } from '../../hooks/redux';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { GetAllSignatures, SignatureRequest } from '../../store/actions/signatures';
import type {
	AccountIdentity,
	PrefsType,
	PropsType,
	SignItemType,
	Signature,
	UpdateSettingsProps
} from '../../types';

/* to keep track of changes done to props we use 3 different values:
 * - originalProps is the status of the props when you open the settings for the first time
 * - currentProps is the current status of the props once saved successfully without refreshing the page
 * - updatedProps it is used to manipulate props settings values in controlled mode.
 * All of them will have originalProps as default value
 * To keep track of unsaved changes we compare updatedProps with currentProps
 *   */
const SettingsView: FC = () => {
	useUpdateView();
	const { attrs, prefs, props } = useUserSettings();
	const account = useUserAccount();
	const { identity } = cloneDeep(account.identities);
	const defaultAccount = remove(identity, (acc: AccountIdentity) => acc.name === 'DEFAULT');
	const identities = defaultAccount.concat(identity);
	const { validate: validateSignatures } = useSignatureSettings();
	const [currentPrefs, setCurrentPrefs] = useState<AccountSettings['prefs']>({ ...prefs });
	const [updatedPrefs, setUpdatedPrefs] = useState({});

	const [currentAttrs, setCurrentAttrs] = useState<AccountSettings['attrs']>({ ...attrs });
	const [updatedAttrs, setUpdatedAttrs] = useState({});
	const originalAttrs = useMemo(() => cloneDeep(attrs), [attrs]);

	const originalProps = useMemo(
		() =>
			reduce(
				props ?? {},
				(acc, v) => ({ ...acc, [v.name]: { app: v.zimlet, value: v._content } }),
				{}
			),
		[props]
	);
	const [currentProps, setCurrentProps] = useState(originalProps);
	const [updatedProps, setUpdatedProps] = useState<PropsType | Record<string, unknown>>(
		originalProps
	);

	const [currentIdentities, setCurrentIdentities] = useState(identities);
	const [updatedIdentities, setUpdatedIdentities] = useState(identities);
	const [signatures, setSignatures] = useState<SignItemType[]>(() => []);
	const [originalSignatures, setOriginalSignatures] = useState<SignItemType[]>(() => []);
	const [disabled, setDisabled] = useState(true);
	const [flag, setFlag] = useState(false);

	const dispatch = useAppDispatch();

	const { createSnackbar } = useUiUtilities();

	const originalPrefs = useMemo(() => {
		const s = cloneDeep(prefs);
		if (s?.zimbraPrefNewMailNotificationAddress === undefined) {
			s.zimbraPrefNewMailNotificationAddress = '';
		}
		if (s?.zimbraPrefForwardReplySignatureId === undefined) {
			s.zimbraPrefForwardReplySignatureId = NO_SIGNATURE_ID;
		}
		if (s?.zimbraPrefDefaultSignatureId === undefined) {
			s.zimbraPrefDefaultSignatureId = NO_SIGNATURE_ID;
		}
		return s;
	}, [prefs]);

	const onClose = useCallback(() => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		setCurrentPrefs({ ...prefs });
		setUpdatedPrefs({});
		setCurrentAttrs({ ...attrs });
		setUpdatedAttrs({});
		// we discard only latest updates keeping successfully saved changes
		setUpdatedProps(currentProps);
		setUpdatedIdentities(identities);
	}, [currentProps, identities, prefs, attrs]);

	const updatePrefs = useCallback(
		(e: UpdateSettingsProps) => {
			setCurrentPrefs({ ...currentPrefs, [e.target.name]: e.target.value });
			setUpdatedPrefs({ ...updatedPrefs, [e.target.name]: e.target.value });
		},
		[currentPrefs, updatedPrefs]
	);

	const updateAttrs = useCallback(
		(e: UpdateSettingsProps) => {
			setCurrentAttrs({ ...currentAttrs, [e.target.name]: e.target.value });
			setUpdatedAttrs({ ...updatedAttrs, [e.target.name]: e.target.value });
		},
		[currentAttrs, updatedAttrs]
	);

	const updateProps = useCallback(
		(e: UpdateSettingsProps) => {
			setUpdatedProps({ ...updatedProps, [e.target.name]: e.target.value });
		},
		[updatedProps]
	);

	const updateIdentities = useCallback(
		(e: {
			id?: string | undefined;
			target?:
				| {
						name: string;
						value: string;
				  }
				| undefined;
			_attrs?: IdentityAttrs | undefined;
		}) => {
			const data = map(updatedIdentities, (item) => {
				if (item.id === e.id) {
					return e;
				}
				return item;
			});
			setUpdatedIdentities(data);
		},
		[updatedIdentities]
	);

	const prefsToUpdate = useMemo(
		() => differenceObject(updatedPrefs, originalPrefs),
		[updatedPrefs, originalPrefs]
	);

	const attrsToUpdate = useMemo(
		() => differenceObject(updatedAttrs, originalAttrs),
		[updatedAttrs, originalAttrs]
	);

	const propsToUpdate = useMemo(
		() => getPropsDiff(currentProps, updatedProps),
		[currentProps, updatedProps]
	);
	const identitiesToUpdate = useMemo(
		() => differenceIdentities(currentIdentities, updatedIdentities),
		[currentIdentities, updatedIdentities]
	);

	const isDisabled = useMemo(
		() =>
			Object.keys(prefsToUpdate).length === 0 &&
			Object.keys(attrsToUpdate).length === 0 &&
			disabled &&
			Object.keys(propsToUpdate).length === 0 &&
			Object.keys(identitiesToUpdate).length === 0,
		[prefsToUpdate, disabled, propsToUpdate, identitiesToUpdate, attrsToUpdate]
	);

	const setNewOrForwardSignatureId = useCallback(
		(itemsAdd, resp, oldSignatureId: string, isFowardSignature: boolean): void => {
			const newOrForwardSignatureToSet = itemsAdd?.find(
				(item: SignItemType) => item.id === oldSignatureId
			);
			if (
				!!newOrForwardSignatureToSet &&
				resp?.payload?.response?.Body?.BatchResponse?.CreateSignatureResponse
			) {
				const createdSignature =
					resp.payload.response.Body.BatchResponse.CreateSignatureResponse[0].signature;
				const realSignatureId = createdSignature.find(
					(item: SignItemType) => item.name === newOrForwardSignatureToSet.label
				).id;
				const signatureKey = isFowardSignature
					? 'zimbraPrefForwardReplySignatureId'
					: 'zimbraPrefDefaultSignatureId';
				saveSettings({
					prefs: { [signatureKey]: realSignatureId }
				}).then(() => {
					setUpdatedPrefs({});
					setUpdatedAttrs({});
				});
			}
		},
		[]
	);

	const onSignaturesLoaded = useCallback(
		(signs: Array<Signature>) => {
			const signaturesItems = map(
				signs,
				(item: Signature, idx) =>
					({
						label: item.name,
						name: item.name,
						id: item.id,
						description: unescape(item?.content?.[0]?._content)
					}) as SignItemType
			);
			setSignatures(signaturesItems);
			setOriginalSignatures(
				signaturesItems.map((el) => ({
					id: el.id,
					name: el.label ?? '',
					label: el.label ?? '',
					description: el.description ?? ''
				}))
			);
		},
		[setOriginalSignatures, setSignatures]
	);

	// Fetches signatures from the BE
	useEffect(() => {
		GetAllSignatures()
			.then(({ signature: signs }) => onSignaturesLoaded(signs))
			.catch((err) => {
				console.error(err);
			});
	}, [onSignaturesLoaded]);

	const saveChanges = useCallback<SettingsHeaderProps['onSave']>(() => {
		if (!isEqual(signatures, originalSignatures)) {
			const validationResult = validateSignatures(signatures);
			if (validationResult.length) {
				// At the moment we show only the last error
				createSnackbar({
					key: `signature-validation-error`,
					severity: 'error',
					label: validationResult[validationResult.length - 1],
					autoHideTimeout: TIMEOUTS.SNACKBAR_DEFAULT_TIMEOUT,
					hideButton: true,
					replace: true
				});
				return Promise.allSettled([Promise.reject(new Error('Invalid signature'))]);
			}

			const itemsDelete = filter(originalSignatures, (x: SignItemType) => {
				let toggle = false;
				map(signatures, (ele: SignItemType) => {
					if (x.id === ele?.id) toggle = true;
				});
				return !toggle;
			});

			const findNewSignatures = (
				updated: Array<SignItemType>,
				original: Array<SignItemType>
			): Array<SignItemType> =>
				filter(updated, (o1) => original.map((o2) => o2.id).indexOf(o1.id) === -1);

			const itemsAdd = findNewSignatures(signatures, originalSignatures);
			const itemsEdit = filter(signatures, (item: SignItemType) =>
				find(
					originalSignatures,
					(c: SignItemType): unknown =>
						item.id === c.id && (item.label !== c.label || item.description !== c.description)
				)
			);

			const isReplySignaturePrefisNew = prefsToUpdate.zimbraPrefForwardReplySignatureId;
			let setForwardReplySignatureId = '';
			if (
				isReplySignaturePrefisNew &&
				itemsAdd.length > 0 &&
				itemsAdd.findIndex(
					(item: any) => item?.id === prefsToUpdate.zimbraPrefForwardReplySignatureId
				) !== -1
			) {
				setForwardReplySignatureId = prefsToUpdate.zimbraPrefForwardReplySignatureId;
				delete prefsToUpdate.zimbraPrefForwardReplySignatureId;
			}

			const isDefaultSignaturePref = prefsToUpdate.zimbraPrefDefaultSignatureId;
			let setDefaultSignatureId = '';
			if (
				isDefaultSignaturePref &&
				itemsAdd.length > 0 &&
				itemsAdd.findIndex(
					(item: any) => item.id === prefsToUpdate.zimbraPrefDefaultSignatureId
				) !== -1
			) {
				setDefaultSignatureId = prefsToUpdate.zimbraPrefDefaultSignatureId;
				delete prefsToUpdate.zimbraPrefDefaultSignatureId;
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(SignatureRequest({ itemsAdd, itemsEdit, itemsDelete, account })).then((resp) => {
				// setFetchSigns(true);
				if (setForwardReplySignatureId !== '') {
					setNewOrForwardSignatureId(itemsAdd, resp, setForwardReplySignatureId, true);
				}
				if (setDefaultSignatureId !== '') {
					setNewOrForwardSignatureId(itemsAdd, resp, setDefaultSignatureId, false);
				}
				if (resp.type.includes('fulfilled')) {
					createSnackbar({
						key: `new`,
						replace: true,
						severity: 'info',
						label: t('message.snackbar.settings_saved', 'Settings saved correctly'),
						autoHideTimeout: 3000,
						hideButton: true
					});
					setFlag(!flag);
					setDisabled(true);
					GetAllSignatures()
						.then(({ signature: signs }) => {
							onSignaturesLoaded(signs);
							updateAccount({ signatures: signs });
						})
						.catch((err) => {
							console.error(err);
						});
				} else {
					createSnackbar({
						key: `new`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}

		let changes = {};
		if (Object.keys(prefsToUpdate).length > 0) {
			changes = { ...changes, prefs: prefsToUpdate };
		}
		if (Object.keys(attrsToUpdate).length > 0) {
			changes = { ...changes, attrs: attrsToUpdate };
		}
		if (Object.keys(propsToUpdate).length > 0) {
			changes = { ...changes, props: propsToUpdate };
		}
		if (Object.keys(identitiesToUpdate).length > 0) {
			changes = { ...changes, identity: { modifyList: identitiesToUpdate } };
		}
		if (!isEmpty(changes)) {
			const editResult = saveSettings(changes)
				.then(() => {
					createSnackbar({
						key: `new`,
						replace: true,
						severity: 'info',
						label: t('message.snackbar.settings_saved', 'Settings saved correctly'),
						autoHideTimeout: 3000,
						hideButton: true
					});
					// saving new values only when request is performed successfully
					setCurrentProps((a) => ({ ...a, ...propsToUpdate }));
					setUpdatedAttrs({});
					/* Update the current Identities with changes if identities updated
					and request is performed successfully */
					if (Object.keys(identitiesToUpdate).length > 0) {
						setCurrentIdentities(updatedIdentities);
					}
				})
				.catch(() => {
					createSnackbar({
						key: `new`,
						replace: true,
						severity: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				});
			return Promise.allSettled([editResult]);
		}
		return Promise.allSettled([Promise.resolve()]);
	}, [
		signatures,
		originalSignatures,
		prefsToUpdate,
		attrsToUpdate,
		propsToUpdate,
		identitiesToUpdate,
		validateSignatures,
		dispatch,
		account,
		createSnackbar,
		setNewOrForwardSignatureId,
		flag,
		onSignaturesLoaded,
		updatedIdentities
	]);

	const title = useMemo(() => t('label.mail_settings', 'Mails settings'), []);
	const addressesConflict = useMemo(() => {
		const allowed = getList(currentAttrs?.amavisWhitelistSender as string[] | undefined);
		const blocked = getList(currentAttrs?.amavisBlacklistSender as string[] | undefined);
		return (
			allowed.length > 0 &&
			blocked.length > 0 &&
			allowed.some((address) => blocked.includes(address))
		);
	}, [currentAttrs]);
	return (
		<>
			<SettingsHeader onSave={saveChanges} onCancel={onClose} isDirty={!isDisabled} title={title} />
			<Container
				orientation="vertical"
				mainAlignment="baseline"
				crossAlignment="baseline"
				background="gray5"
				style={{ overflowY: 'auto' }}
			>
				<FormSection minWidth="calc(min(100%, 32rem))">
					<DisplayMessagesSettings
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						settingsObj={currentPrefs}
						updateSettings={updatePrefs}
						updatedProps={updatedProps}
						updateProps={updateProps}
					/>
					<ReceivingMessagesSettings
						settingsObj={currentPrefs as PrefsType}
						updateSettings={updatePrefs}
						updatedProps={updatedProps}
						updateProps={updateProps}
					/>
					<RecoverMessages />
					<SignatureSettings
						setSignatures={setSignatures}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						updatedIdentities={updatedIdentities}
						updateIdentities={updateIdentities}
						setDisabled={setDisabled}
						signatures={signatures}
					/>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
					{/* @ts-ignore */}
					<ComposeMessage settingsObj={currentPrefs} updateSettings={updatePrefs} />
					<FilterModule />
					<TrusteeAddresses settingsObj={currentPrefs} updateSettings={updatePrefs} />
					<SendersList
						settingsObj={currentAttrs}
						updateSettings={updateAttrs}
						listType="Allowed"
						showConflictText={addressesConflict}
					/>
					<SendersList
						settingsObj={currentAttrs}
						updateSettings={updateAttrs}
						listType="Blocked"
						showConflictText={addressesConflict}
					/>
				</FormSection>
			</Container>
		</>
	);
};

export default SettingsView;
