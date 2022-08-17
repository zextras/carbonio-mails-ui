/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useMemo, useCallback, FC } from 'react';
import {
	useUserSettings,
	useUserAccount,
	editSettings,
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	SettingsHeader,
	getBridgedFunctions
} from '@zextras/carbonio-shell-ui';
import { useDispatch } from 'react-redux';
import { map, forEach, isEqual, filter, find, cloneDeep, isEmpty, reduce } from 'lodash';
import { Container, FormSection } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { getPropsDiff, differenceObject } from './components/utils';
import DisplayMessagesSettings from './displaying-messages-settings';
import ReceivingMessagesSettings from './receiving-messages-settings';
import SignatureSettings from './signature-settings';
import FilterModule from './filters';
import TrusteeAddresses from './trustee-addresses';
import { SignatureRequest } from '../../store/actions/signatures';
import { PropsType, SignItemType } from '../../types';

/* to keep track of changes done to props we use 3 different values:
 * - originalProps is the status of the props when you open the settings for the first time
 * - currentProps is the current status of the props once saved successfully without refreshing the page
 * - updatedProps it is used to manipulate props settings values in controlled mode.
 * All of them will have originalProps as default value
 * To keep track of unsaved changes we compare updatedProps with currentProps
 *   */
const SettingsView: FC = () => {
	const [t] = useTranslation();
	const { prefs, props } = useUserSettings();

	const account = useUserAccount();
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const [settingsObj, setSettingsObj] = useState<PrefsType>({ ...prefs });
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
	const [signItems, setSignItems] = useState([]);
	const [signItemsUpdated, setSignItemsUpdated] = useState([]);
	const [disabled, setDisabled] = useState(true);
	const [flag, setFlag] = useState(false);

	const dispatch = useDispatch();
	// const [fetchSigns, setFetchSigns] = useState(true);

	const oldSettings = useMemo(() => {
		const s = cloneDeep(prefs);
		if (s?.zimbraPrefNewMailNotificationAddress === undefined) {
			s.zimbraPrefNewMailNotificationAddress = '';
		}
		if (s?.zimbraPrefForwardReplySignatureId === undefined) {
			s.zimbraPrefForwardReplySignatureId = '11111111-1111-1111-1111-111111111111';
		}
		if (s?.zimbraPrefDefaultSignatureId === undefined) {
			s.zimbraPrefDefaultSignatureId = '11111111-1111-1111-1111-111111111111';
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
	}, [currentProps, prefs]);

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

	const settingsToUpdate = useMemo(
		() => differenceObject(updatedSettings, oldSettings),
		[updatedSettings, oldSettings]
	);

	const propsToUpdate = useMemo(
		() => getPropsDiff(currentProps, updatedProps),
		[currentProps, updatedProps]
	);

	const isDisabled = useMemo(
		() =>
			Object.keys(settingsToUpdate).length === 0 &&
			disabled &&
			Object.keys(propsToUpdate).length === 0,
		[settingsToUpdate, disabled, propsToUpdate]
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

	// eslint-disable-next-line consistent-return
	const saveChanges = useCallback(() => {
		let changes = {};

		if (!isEqual(signItems, signItemsUpdated)) {
			let hasError = false;
			forEach(signItems, (i: SignItemType) => {
				if (!i.label || !i.description) hasError = true;
			});

			if (hasError) {
				getBridgedFunctions()?.createSnackbar({
					key: `error`,
					type: 'error',
					label: t('label.signature_required', 'Signature information is required.'),
					autoHideTimeout: 3000,
					hideButton: true,
					replace: true
				});
				return false;
			}
			const itemsDelete = filter(signItemsUpdated, (x: SignItemType) => {
				let toggle = false;
				map(signItems, (ele: SignItemType) => {
					if (x.id === ele?.id) toggle = true;
				});
				return !toggle;
			});

			const findItems = (
				arr1: Array<SignItemType>,
				arr2: Array<SignItemType>
			): Array<SignItemType> => filter(arr1, (o1) => arr2.map((o2) => o2.id).indexOf(o1.id) === -1);

			const itemsAdd = findItems(signItems, signItemsUpdated);
			const itemsEdit = filter(signItems, (item: SignItemType) =>
				find(
					signItemsUpdated,
					(c: SignItemType): unknown =>
						item.id === c.id && (item.label !== c.label || item.description !== c.description)
				)
			);

			const isReplySignaturePrefisNew =
				settingsToUpdate.zimbraPrefForwardReplySignatureId &&
				!settingsToUpdate.zimbraPrefForwardReplySignatureId.includes('-');
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

			const isDefaultSignaturePref =
				settingsToUpdate.zimbraPrefDefaultSignatureId &&
				!settingsToUpdate.zimbraPrefDefaultSignatureId.includes('-');
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
			dispatch(SignatureRequest({ itemsAdd, itemsEdit, itemsDelete, account })).then((resp) => {
				// setFetchSigns(true);
				if (setForwardReplySignatureId !== '') {
					setNewOrForwardSignatureId(itemsAdd, resp, setForwardReplySignatureId, true);
				}
				if (setDefaultSignatureId !== '') {
					setNewOrForwardSignatureId(itemsAdd, resp, setDefaultSignatureId, false);
				}
				if (resp.type.includes('fulfilled')) {
					getBridgedFunctions()?.createSnackbar({
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
					getBridgedFunctions()?.createSnackbar({
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

		if (!isEmpty(changes)) {
			editSettings(changes).then((res) => {
				if (res.type.includes('fulfilled')) {
					getBridgedFunctions()?.createSnackbar({
						key: `new`,
						replace: true,
						type: 'info',
						label: t('message.snackbar.settings_saved', 'Settings saved correctly'),
						autoHideTimeout: 3000,
						hideButton: true
					});
					// saving new values only when request is performed successfully
					setCurrentProps((a) => ({ ...a, ...propsToUpdate }));
				} else {
					getBridgedFunctions()?.createSnackbar({
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
	}, [
		signItems,
		signItemsUpdated,
		settingsToUpdate,
		propsToUpdate,
		dispatch,
		account,
		t,
		setNewOrForwardSignatureId,
		flag
	]);

	const title = useMemo(() => t('label.mail_settings', 'Mails settings'), [t]);
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
				<FormSection minWidth="calc(min(100%, 512px))">
					<DisplayMessagesSettings
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						settingsObj={settingsObj}
						updateSettings={updateSettings}
					/>
					<ReceivingMessagesSettings
						settingsObj={settingsObj}
						updateSettings={updateSettings}
						updatedProps={updatedProps}
						updateProps={updateProps}
					/>
					<SignatureSettings
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						settingsObj={settingsObj}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						setSignItems={setSignItems}
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						setSignItemsUpdated={setSignItemsUpdated}
						updateSettings={updateSettings}
						// disabled={disabled}
						setDisabled={setDisabled}
						signItems={signItems}
						signItemsUpdated={signItemsUpdated}
						flag={flag}
					/>
					<FilterModule />
					<TrusteeAddresses settingsObj={settingsObj} updateSettings={updateSettings} />
				</FormSection>
			</Container>
		</>
	);
};

export default SettingsView;
