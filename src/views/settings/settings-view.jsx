/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useMemo, useCallback, useContext } from 'react';
import { useUserSettings, useUserAccount, editSettings } from '@zextras/carbonio-shell-ui';
import { useDispatch } from 'react-redux';
import { map, forEach, isEqual, filter, find, cloneDeep } from 'lodash';
import {
	Container,
	Padding,
	Text,
	Button,
	Row,
	Divider,
	FormSection,
	SnackbarManagerContext
} from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import { differenceObject } from './components/utils';
import DisplayMessagesSettings from './displaying-messages-settings';
import ReceivingMessagesSettings from './receiving-messages-settings';
import SignatureSettings from './signature-settings';
import FilterModule from './filters';
import { SignatureRequest } from '../../store/actions/signatures';
import LoadingShimmer from './filters/parts/loading-shimmer';

export default function SettingsView() {
	const [t] = useTranslation();
	const settings = useUserSettings()?.prefs;
	const oldSettings = useMemo(() => {
		const s = cloneDeep(settings);
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
	}, [settings]);

	const account = useUserAccount();
	const [settingsObj, setSettingsObj] = useState({ ...settings });
	const [updatedSettings, setUpdatedSettings] = useState({});
	const [signItems, setSignItems] = useState([]);
	const [signItemsUpdated, setSignItemsUpdated] = useState([]);
	const [disabled, setDisabled] = useState(true);
	const [flag, setFlag] = useState(false);
	const createSnackbar = useContext(SnackbarManagerContext);
	const dispatch = useDispatch();
	const [loading, setLoading] = useState(false);
	function callLoader() {
		setLoading(true);
		setTimeout(() => setLoading(false), 10);
	}

	const onClose = useCallback(() => {
		setSettingsObj({ ...settings });
		setUpdatedSettings({});
		/* added loading to update the layout without refreshing the page.
		As the select cannot be used in controlled mode and defaultValue renders for first time only. */
		callLoader();
	}, [settings]);

	const updateSettings = useCallback(
		(e) => {
			setSettingsObj({ ...settingsObj, [e.target.name]: e.target.value });
			setUpdatedSettings({ ...updatedSettings, [e.target.name]: e.target.value });
		},
		[settingsObj, updatedSettings]
	);

	const settingsToUpdate = useMemo(
		() => differenceObject(updatedSettings, oldSettings),
		[updatedSettings, oldSettings]
	);

	const isDisabled = useMemo(
		() => Object.keys(settingsToUpdate).length === 0 && disabled,
		[settingsToUpdate, disabled]
	);
	const setNewOrForwardSignatureId = (itemsAdd, resp, oldSignatureId, isFowardSignature) => {
		const newOrForwardSignatureToSet = itemsAdd.find((item) => item.id === oldSignatureId);
		if (
			!!newOrForwardSignatureToSet &&
			resp?.payload?.response?.Body?.BatchResponse?.CreateSignatureResponse
		) {
			const createdSignature =
				resp.payload.response.Body.BatchResponse.CreateSignatureResponse[0].signature;
			const realSignatureId = createdSignature.find(
				(item) => item.name === newOrForwardSignatureToSet.label
			).id;
			const signatureKey = isFowardSignature
				? 'zimbraPrefForwardReplySignatureId'
				: 'zimbraPrefDefaultSignatureId';
			editSettings({
				prefs: { [signatureKey]: realSignatureId }
			}).then((res) => {
				setUpdatedSettings({});
			});
		}
	};

	// eslint-disable-next-line consistent-return
	const saveChanges = useCallback(() => {
		if (!isEqual(signItems, signItemsUpdated)) {
			let hasError = false;
			forEach(signItems, (i) => {
				if (!i.label || !i.description) hasError = true;
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
				return false;
			}
			const itemsDelete = filter(signItemsUpdated, (x) => {
				let toggle = false;
				map(signItems, (ele) => {
					if (x.id === ele?.id) toggle = true;
				});
				return !toggle;
			});

			const findItems = (arr1, arr2) =>
				filter(arr1, (o1) => arr2.map((o2) => o2.id).indexOf(o1.id) === -1);

			const itemsAdd = findItems(signItems, signItemsUpdated);
			const itemsEdit = filter(signItems, (item) =>
				find(
					signItemsUpdated,
					(c) => item.id === c.id && (item.label !== c.label || item.description !== c.description)
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
					(item) => item.id === settingsToUpdate.zimbraPrefForwardReplySignatureId
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
				itemsAdd.findIndex((item) => item.id === settingsToUpdate.zimbraPrefDefaultSignatureId) !==
					-1
			) {
				setDefaultSignatureId = settingsToUpdate.zimbraPrefDefaultSignatureId;
				delete settingsToUpdate.zimbraPrefDefaultSignatureId;
			}
			dispatch(SignatureRequest({ itemsAdd, itemsEdit, itemsDelete, account })).then((resp) => {
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
			editSettings({ prefs: settingsToUpdate }).then((res) => {
				if (res.type.includes('fulfilled')) {
					createSnackbar({
						key: `new`,
						replace: true,
						type: 'info',
						label: t('message.snackbar.settings_saved', 'Settings saved correctly'),
						autoHideTimeout: 3000,
						hideButton: true
					});
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
	}, [signItems, signItemsUpdated, settingsToUpdate, dispatch, account, createSnackbar, t, flag]);
	return loading ? (
		<LoadingShimmer />
	) : (
		<Container
			orientation="vertical"
			mainAlignment="space-around"
			background="gray5"
			style={{ overflowY: 'auto' }}
		>
			<Row orientation="horizontal" width="100%">
				<Row
					padding={{ all: 'small' }}
					mainAlignment="flex-start"
					width="50%"
					crossAlignment="flex-start"
				>
					<Text size="large" weight="regular">
						{t('label.mail_settings', 'Mails settings')}
					</Text>
				</Row>
				<Row
					padding={{ all: 'small' }}
					width="50%"
					mainAlignment="flex-end"
					crossAlignment="flex-end"
				>
					<Padding right="small">
						<Button
							label={t('label.discard_changes', 'DISCARD CHANGES')}
							onClick={onClose}
							color="secondary"
							disabled={isDisabled}
						/>
					</Padding>
					<Button
						label={t('label.save', 'Save')}
						color="primary"
						onClick={saveChanges}
						disabled={isDisabled}
					/>
				</Row>
			</Row>
			<Divider />
			<Container
				orientation="vertical"
				mainAlignment="baseline"
				crossAlignment="baseline"
				background="gray5"
				style={{ overflowY: 'auto' }}
			>
				<FormSection minWidth="calc(min(100%, 512px))">
					<DisplayMessagesSettings
						t={t}
						settingsObj={settingsObj}
						updateSettings={updateSettings}
					/>
					<ReceivingMessagesSettings
						t={t}
						settingsObj={settingsObj}
						updateSettings={updateSettings}
					/>
					<SignatureSettings
						t={t}
						settingsObj={settingsObj}
						updateSettings={updateSettings}
						disabled={disabled}
						setDisabled={setDisabled}
						signItems={signItems}
						setSignItems={setSignItems}
						signItemsUpdated={signItemsUpdated}
						setSignItemsUpdated={setSignItemsUpdated}
						flag={flag}
					/>
					<FilterModule t={t} />
				</FormSection>
			</Container>
		</Container>
	);
}
