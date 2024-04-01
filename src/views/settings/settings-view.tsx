/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useMemo, useState } from 'react';

import { Container, FormSection } from '@zextras/carbonio-design-system';
import {
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeaderProps,
	editSettings,
	t,
	useUserAccount,
	useUserSettings
} from '@zextras/carbonio-shell-ui';
import { cloneDeep, filter, find, forEach, isEmpty, isEqual, map, reduce, remove } from 'lodash';

import { differenceIdentities, differenceObject, getPropsDiff } from './components/utils';
import ComposeMessage from './compose-msg-settings';
import DisplayMessagesSettings from './displaying-messages-settings';
import FilterModule from './filters';
import { useSignatureSettings } from './hooks/use-signature-settings';
import ReceivingMessagesSettings from './receiving-messages-settings';
import { RecoverMessages } from './recover-messages';
import SignatureSettings from './signature-settings';
import TrusteeAddresses from './trustee-addresses';
import { TIMEOUTS } from '../../constants';
import { NO_SIGNATURE_ID } from '../../helpers/signatures';
import { useAppDispatch } from '../../hooks/redux';
import { useUiUtilities } from '../../hooks/use-ui-utilities';
import { SignatureRequest } from '../../store/actions/signatures';
import type { AccountIdentity, PropsType, SignItemType } from '../../types';

/* to keep track of changes done to props we use 3 different values:
 * - originalProps is the status of the props when you open the settings for the first time
 * - currentProps is the current status of the props once saved successfully without refreshing the page
 * - updatedProps it is used to manipulate props settings values in controlled mode.
 * All of them will have originalProps as default value
 * To keep track of unsaved changes we compare updatedProps with currentProps
 *   */
const SettingsView: FC = () => {
	const { prefs, props, attrs } = useUserSettings();
	const account = useUserAccount();
	const { identity } = cloneDeep(account.identities);
	const defaultAccount = remove(identity, (acc: AccountIdentity) => acc.name === 'DEFAULT');
	const identities = defaultAccount.concat(identity);
	const { validate: validateSignatures } = useSignatureSettings();

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const [settingsObj, setSettingsObj] = useState<AccountSettingsPrefs>({ ...prefs });
	const [updatedSettings, setUpdatedSettings] = useState({});
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
	const [originalSignatures, setOriginalSignatures] = useState(() => []);
	const [disabled, setDisabled] = useState(true);
	const [flag, setFlag] = useState(false);

	const dispatch = useAppDispatch();

	const { createSnackbar } = useUiUtilities();

	const oldSettings = useMemo(() => {
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
		setSettingsObj({ ...prefs });
		setUpdatedSettings({});
		// we discard only latest updates keeping successfully saved changes
		setUpdatedProps(currentProps);
		setUpdatedIdentities(identities);
	}, [currentProps, identities, prefs]);

	const updateSettings = useCallback(
		(e) => {
			setSettingsObj({ ...settingsObj, [e.target.name]: e.target.value });
			setUpdatedSettings({ ...updatedSettings, [e.target.name]: e.target.value });
		},
		[settingsObj, updatedSettings]
	);

	const updateProps = useCallback(
		(e) => {
			setUpdatedProps({ ...updatedProps, [e.target.name]: e.target.value });
		},
		[updatedProps]
	);

	const updateIdentities = useCallback(
		(e) => {
			const data = map(updatedIdentities, (item: AccountIdentity) => {
				if (item.id === e.id) {
					return e;
				}
				return item;
			});
			setUpdatedIdentities(data);
		},
		[updatedIdentities]
	);

	const settingsToUpdate = useMemo(
		() => differenceObject(updatedSettings, oldSettings),
		[updatedSettings, oldSettings]
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
			Object.keys(settingsToUpdate).length === 0 &&
			disabled &&
			Object.keys(propsToUpdate).length === 0 &&
			Object.keys(identitiesToUpdate).length === 0,
		[settingsToUpdate, disabled, propsToUpdate, identitiesToUpdate]
	);
	const setNewOrForwardSignatureId = useCallback(
		(itemsAdd, resp, oldSignatureId, isFowardSignature): void => {
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
				editSettings({
					prefs: { [signatureKey]: realSignatureId }
				}).then(() => {
					setUpdatedSettings({});
				});
			}
		},
		[]
	);

	const saveChanges = useCallback<SettingsHeaderProps['onSave']>(() => {
		let changes = {};
		if (!isEqual(signatures, originalSignatures)) {

			let hasError = false;
			forEach(signatures, (i: SignItemType) => {
				if (!i.label || !i.usedSign) hasError = true;
			});

			if (hasError) {
				createSnackbar({
					key: `error`,
					type: 'error',
					label: t('label.signature_required', 'Signature information is required.'),
					autoHideTimeout: 3000,
					hideButton: true,
					replace: true
				});
				return Promise.allSettled([Promise.reject(new Error('Invalid signature'))]);
			}

			const validationResult = validateSignatures(signatures);
			if (validationResult.length) {
				// At the moment we show only the last error
				createSnackbar({
					key: `signature-validation-error`,
					type: 'error',
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
						item.id === c.id && (item.label !== c.label || item.usedSign !== c.usedSign)
				)
			);

			const isReplySignaturePrefisNew = settingsToUpdate.zimbraPrefForwardReplySignatureId;
			let setForwardReplySignatureId = '';
			if (
				isReplySignaturePrefisNew &&
				itemsAdd.length > 0 &&
				itemsAdd.findIndex(
					(item: any) => item?.id === settingsToUpdate.zimbraPrefForwardReplySignatureId
				) !== -1
			) {
				setForwardReplySignatureId = settingsToUpdate.zimbraPrefForwardReplySignatureId;
				delete settingsToUpdate.zimbraPrefForwardReplySignatureId;
			}

			const isDefaultSignaturePref = settingsToUpdate.zimbraPrefDefaultSignatureId;
			let setDefaultSignatureId = '';
			if (
				isDefaultSignaturePref &&
				itemsAdd.length > 0 &&
				itemsAdd.findIndex(
					(item: any) => item.id === settingsToUpdate.zimbraPrefDefaultSignatureId
				) !== -1
			) {
				setDefaultSignatureId = settingsToUpdate.zimbraPrefDefaultSignatureId;
				delete settingsToUpdate.zimbraPrefDefaultSignatureId;
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			dispatch(SignatureRequest({ itemsAdd, itemsEdit, itemsDelete, account, settingsObj })).then((resp) => {
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
						type: 'info',
						label: t('message.snackbar.settings_saved', 'Settings saved correctly'),
						autoHideTimeout: 3000,
						hideButton: true
					});
					setFlag(!flag);
					setDisabled(true);
				} else {
					createSnackbar({
						key: `new`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
		}

		if (Object.keys(settingsToUpdate).length > 0) {
			changes = { ...changes, prefs: settingsToUpdate };
		}
		if (Object.keys(propsToUpdate).length > 0) {
			changes = { ...changes, props: propsToUpdate };
		}
		if (Object.keys(identitiesToUpdate).length > 0) {
			changes = { ...changes, identity: { modifyList: identitiesToUpdate } };
		}
		if (!isEmpty(changes)) {
			const editResult = editSettings(changes).then((res) => {
				if (res.type.includes('fulfilled')) {
					createSnackbar({
						key: `new`,
						replace: true,
						type: 'info',
						label: t('message.snackbar.settings_saved', 'Settings saved correctly'),
						autoHideTimeout: 3000,
						hideButton: true
					});
					// saving new values only when request is performed successfully
					setCurrentProps((a) => ({ ...a, ...propsToUpdate }));
					/* Update the current Identities with changes if identities updated
						and request is performed successfully
					*/
					if (Object.keys(identitiesToUpdate).length > 0) {
						setCurrentIdentities(updatedIdentities);
					}
				} else {
					createSnackbar({
						key: `new`,
						replace: true,
						type: 'error',
						label: t('label.error_try_again', 'Something went wrong, please try again'),
						autoHideTimeout: 3000,
						hideButton: true
					});
				}
			});
			return Promise.allSettled([editResult]);
		}
		return Promise.allSettled([Promise.resolve()]);
	}, [
		signatures,
		originalSignatures,
		settingsToUpdate,
		propsToUpdate,
		identitiesToUpdate,
		validateSignatures,
		dispatch,
		account,
		createSnackbar,
		setNewOrForwardSignatureId,
		flag,
		updatedIdentities
	]);

	const title = useMemo(() => t('label.mail_settings', 'Mails settings'), []);
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
						settingsObj={settingsObj}
						updateSettings={updateSettings}
						updatedProps={updatedProps}
						updateProps={updateProps}
					/>
					<ReceivingMessagesSettings
						settingsObj={settingsObj}
						updateSettings={updateSettings}
						updatedProps={updatedProps}
						updateProps={updateProps}
					/>
					<RecoverMessages />
					<SignatureSettings
						settingsObj={settingsObj}
						setSignatures={setSignatures}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						setOriginalSignatures={setOriginalSignatures}
						updateSettings={updateSettings}
						updatedIdentities={updatedIdentities}
						updateIdentities={updateIdentities}
						setDisabled={setDisabled}
						signatures={signatures}
						flag={flag}
					/>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
					{/* @ts-ignore */}
					<ComposeMessage settingsObj={settingsObj} updateSettings={updateSettings} />
					<FilterModule />
					<TrusteeAddresses settingsObj={settingsObj} updateSettings={updateSettings} />
				</FormSection>
			</Container>
		</>
	);
};

export default SettingsView;
