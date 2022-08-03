/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useMemo, useCallback, useEffect, FC, useContext } from 'react';
import { Container, SnackbarManagerContext } from '@zextras/carbonio-design-system';
import { FOLDERS } from '@zextras/carbonio-shell-ui';
import { filter, includes, isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import ModalFooter from '../../commons/modal-footer';
import { ModalHeader } from '../../commons/modal-header';
import { folderAction } from '../../../../store/actions/folder-action';
import NameInputRow from './name-input';
import FolderDetails from './folder-details';
import RetentionPolicies from './retention-policies';
import { ShareFolderProperties } from './share-folder-properties';
import { translatedSystemFolders } from '../../utils';
import { ModalProps } from '../../../../types';

const retentionPeriod = [
	{
		label: 'Days',
		value: 'd'
	},
	{
		label: 'Weeks',
		value: 'w'
	},
	{
		label: 'Months',
		value: 'm'
	},
	{
		label: 'Years',
		value: 'y'
	}
];
const numberRegex = /^\d+$/;

type EditModalProps = ModalProps & {
	setActiveModal: (modal: string) => void;
};

const EditDefaultModal: FC<EditModalProps> = ({ folder, onClose, setActiveModal }) => {
	const [t] = useTranslation();
	const dispatch = useDispatch();
	// eslint-disable-next-line @typescript-eslint/ban-types
	const createSnackbar = useContext(SnackbarManagerContext) as Function;

	const [inputValue, setInputValue] = useState(folder.folder?.name);
	const [showPolicy, setShowPolicy] = useState(false);
	const [rtnValue, setRtnValue] = useState<number | string>(0);
	const [purgeValue, setPurgeValue] = useState<number | string>(0);
	const [rtnYear, setRtnYear] = useState<string | null>('d');
	const [dspYear, setDspYear] = useState<string | null>('d');
	const [rtnRange, setRtnRange] = useState('');
	const [dspRange, setDspRange] = useState<string>('');
	const [dsblMsgDis, setDsblMsgDis] = useState(false);
	const [dsblMsgRet, setDsblMsgRet] = useState(false);
	const [emptyRtnValue, setEmptyRtnValue] = useState(false);
	const [emptyDisValue, setEmptyDisValue] = useState(false);
	const [folderColor, setFolderColor] = useState(folder.folder?.color);

	useEffect(() => {
		if (
			folder.folder?.retentionPolicy &&
			folder.folder?.retentionPolicy?.length &&
			folder.folder?.retentionPolicy[0].keep !== undefined &&
			folder.folder?.retentionPolicy[0].keep &&
			Object.keys(folder.folder?.retentionPolicy[0].keep[0]).length !== 0
		) {
			const lifetime = folder.folder?.retentionPolicy[0]?.keep[0]?.policy[0]?.lifetime;
			// eslint-disable-next-line radix
			const d = parseInt(lifetime);
			setDsblMsgRet(true);
			setShowPolicy(true);

			if (d % 365 === 0) {
				setRtnYear('y');
				setRtnValue(d / 365);
				setRtnRange('Years');
			} else if (d % 31 === 0) {
				setRtnYear('m');
				setRtnValue(d / 31);
				setRtnRange('Months');
			} else if (d % 7 === 0) {
				setRtnYear('w');
				setRtnValue(d / 7);
				setRtnRange('Weeks');
			} else {
				setRtnYear('d');
				setRtnValue(d);
				setRtnRange('Days');
			}
		} else {
			setRtnYear('d');
			setRtnRange('Days');
		}

		if (
			folder.folder?.retentionPolicy &&
			folder.folder?.retentionPolicy.length &&
			folder.folder?.retentionPolicy[0].purge !== undefined &&
			folder.folder?.retentionPolicy[0].purge &&
			Object.keys(folder.folder?.retentionPolicy[0].purge[0]).length !== 0
		) {
			const lifetime = folder.folder?.retentionPolicy[0]?.purge[0]?.policy[0]?.lifetime;
			// eslint-disable-next-line radix
			const d = parseInt(lifetime);
			setDsblMsgDis(true);
			setShowPolicy(true);

			if (d % 365 === 0) {
				setDspYear('y');
				setPurgeValue(d / 365);
				setDspRange('Years');
			} else if (d % 31 === 0) {
				setDspYear('m');
				setPurgeValue(d / 31);
				setDspRange('Months');
			} else if (d % 7 === 0) {
				setDspYear('w');
				setPurgeValue(d / 7);
				setDspRange('Weeks');
			} else {
				setDspYear('d');
				setPurgeValue(d);
				setDspRange('Days');
			}
		} else {
			setDspYear('d');
			setDspRange('Days');
		}
	}, [folder.folder?.retentionPolicy]);

	const showWarning = useMemo(
		() =>
			includes(
				filter(translatedSystemFolders, (f) => f !== folder.folder?.name),
				inputValue
			),
		[inputValue, folder]
	);
	const inpDisable = useMemo(
		() =>
			includes(
				[FOLDERS.INBOX, FOLDERS.TRASH, FOLDERS.SPAM, FOLDERS.SENT, FOLDERS.DRAFTS],
				folder.id
			),
		[folder]
	);
	const disableSubmit = useMemo(() => showWarning || emptyRtnValue, [showWarning, emptyRtnValue]);

	const onConfirm = useCallback(() => {
		let submit = true;
		if (dsblMsgRet) {
			submit = false;
			if (rtnValue && numberRegex.test(rtnValue.toString())) {
				submit = true;
			} else {
				setEmptyRtnValue(true);
				return;
			}
		}

		if (dsblMsgDis) {
			submit = false;
			if (purgeValue && numberRegex.test(purgeValue.toString())) {
				submit = true;
			} else {
				setEmptyDisValue(true);
				return;
			}
		}
		if (inputValue && submit) {
			let lt = 1;
			let pr = 1;

			if (rtnYear === 'w') lt = Number(rtnValue) * 7;
			else if (rtnYear === 'm') lt = Number(rtnValue) * 31;
			else if (rtnYear === 'y') lt = Number(rtnValue) * 365;
			else lt = Number(rtnValue);

			if (dspYear === 'w') pr = Number(purgeValue) * 7;
			else if (dspYear === 'm') pr = Number(purgeValue) * 31;
			else if (dspYear === 'y') pr = Number(purgeValue) * 365;
			else pr = Number(purgeValue);

			dispatch(
				folderAction({
					folder: {
						...folder.folder,
						parent: folder.folder?.l,
						path: folder.folder?.absFolderPath,
						absParent: '2',
						children: []
					},
					name: inputValue,
					op: 'update',
					color: folderColor,
					retentionPolicy:
						dsblMsgRet || dsblMsgDis || folder?.folder.retentionPolicy
							? {
									keep: dsblMsgRet
										? {
												policy: {
													lifetime: `${lt}d`,
													type: 'user'
												}
										  }
										: {},
									purge: dsblMsgDis
										? {
												policy: {
													lifetime: `${pr}d`,
													type: 'user'
												}
										  }
										: {}
							  }
							: {}
				})
			)
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				.then((res) => {
					if (res.type.includes('fulfilled')) {
						createSnackbar({
							key: `edit`,
							replace: true,
							type: 'info',
							hideButton: true,
							label: t('messages.snackbar.folder_edited', 'Changes correctly saved'),
							autoHideTimeout: 3000
						});
					} else {
						createSnackbar({
							key: `edit`,
							replace: true,
							type: 'error',
							hideButton: true,
							label: t('label.error_try_again', 'Something went wrong, please try again'),
							autoHideTimeout: 3000
						});
					}
				});
		}
		setInputValue('');
		onClose();
	}, [
		dsblMsgRet,
		dsblMsgDis,
		inputValue,
		onClose,
		rtnValue,
		purgeValue,
		rtnYear,
		dspYear,
		dispatch,
		folder,
		folderColor,
		createSnackbar,
		t
	]);

	return (
		<>
			<ModalHeader
				onClose={onClose}
				title={`${t('label.edit_folder_properties', {
					name: folder.folder?.name,
					defaultValue: 'Edit {{name}} properties'
				})}`}
			/>

			<NameInputRow
				showWarning={showWarning}
				setInputValue={setInputValue}
				inputValue={inputValue}
				inpDisable={inpDisable}
				folderColor={folderColor}
				setFolderColor={setFolderColor}
			/>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" padding={{ top: 'medium' }}>
				<FolderDetails folder={folder} />

				{!isEmpty(folder?.folder.acl) && !folder.folder?.owner && (
					<ShareFolderProperties
						folder={folder}
						setfolder={(): null => null}
						totalAppointments={folder.folder?.n}
						setActiveModal={setActiveModal}
					/>
				)}
				<RetentionPolicies
					setShowPolicy={setShowPolicy}
					emptyRtnValue={emptyRtnValue}
					setEmptyRtnValue={setEmptyRtnValue}
					showPolicy={showPolicy}
					dsblMsgRet={dsblMsgRet}
					setDsblMsgRet={setDsblMsgRet}
					setRtnValue={setRtnValue}
					rtnValue={rtnValue}
					retentionPeriod={retentionPeriod}
					setRtnYear={setRtnYear}
					dsblMsgDis={dsblMsgDis}
					emptyDisValue={emptyDisValue}
					setEmptyDisValue={setEmptyDisValue}
					setDsblMsgDis={setDsblMsgDis}
					setPurgeValue={setPurgeValue}
					setDspYear={setDspYear}
					rtnYear={rtnYear}
					rtnRange={rtnRange}
					dspYear={dspYear}
					dspRange={dspRange}
					purgeValue={purgeValue}
				/>
			</Container>

			<ModalFooter
				onConfirm={onConfirm}
				label={t('label.edit', 'Edit')}
				secondaryAction={(): void => setActiveModal('share')}
				secondaryLabel={t('folder.modal.edit.add_share', 'Add Share')}
				disabled={disableSubmit}
				secondaryBtnType="outlined"
				secondaryColor="primary"
			/>
		</>
	);
};

export default EditDefaultModal;
