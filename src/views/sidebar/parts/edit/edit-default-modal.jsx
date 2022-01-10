/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Container } from '@zextras/zapp-ui';
import { filter, includes, isEmpty } from 'lodash';
import ModalFooter from '../../commons/modal-footer';
import { ModalHeader } from '../../commons/modal-header';
import { folderAction } from '../../../../store/actions/folder-action';
import NameInputRow from './name-input';
import FolderDetails from './folder-details';
import RetentionPolicies from './retention-policies';
import { ShareFolderProperties } from './share-folder-properties';

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
const numberRegex = /^[0-9]+$'/;

const EditDefaultModal = ({
	t,
	currentFolder,
	setModal,
	dispatch,
	createSnackbar,
	allFolders,
	onClose,
	setActiveModal
}) => {
	const [inputValue, setInputValue] = useState(currentFolder.name);
	const [showPolicy, setShowPolicy] = useState(false);
	const [rtnValue, setRtnValue] = useState('');
	const [purgeValue, setPurgeValue] = useState('');
	const [rtnYear, setRtnYear] = useState('d');
	const [dspYear, setDspYear] = useState('d');
	const [rtnRange, setRtnRange] = useState('');
	const [dspRange, setDspRange] = useState('');
	const [dsblMsgDis, setDsblMsgDis] = useState(false);
	const [dsblMsgRet, setDsblMsgRet] = useState(false);
	const [emptyRtnValue, setEmptyRtnValue] = useState(false);
	const [emptyDisValue, setEmptyDisValue] = useState(false);
	const [folderColor, setFolderColor] = useState(currentFolder.color);
	const folderArray = useMemo(
		() => [
			t('folders.inbox', 'Inbox'),
			t('label.sent', 'Sent'),
			t('folders.drafts', 'Drafts'),
			t('folders.trash', 'Trash'),
			t('folders.spam', 'Spam')
		],
		[t]
	);

	useEffect(() => {
		if (
			currentFolder?.retentionPolicy &&
			currentFolder?.retentionPolicy.length &&
			currentFolder.retentionPolicy[0].keep !== undefined &&
			currentFolder.retentionPolicy[0].keep &&
			Object.keys(currentFolder.retentionPolicy[0].keep[0]).length !== 0
		) {
			const lifetime = currentFolder.retentionPolicy[0]?.keep[0]?.policy[0]?.lifetime;
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
			currentFolder?.retentionPolicy &&
			currentFolder?.retentionPolicy.length &&
			currentFolder.retentionPolicy[0].purge !== undefined &&
			currentFolder.retentionPolicy[0].purge &&
			Object.keys(currentFolder.retentionPolicy[0].purge[0]).length !== 0
		) {
			const lifetime = currentFolder.retentionPolicy[0]?.purge[0]?.policy[0]?.lifetime;
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
	}, [currentFolder.retentionPolicy]);

	const showWarning = useMemo(
		() =>
			includes(
				filter(folderArray, (f) => f !== currentFolder.name),
				inputValue
			),
		[folderArray, inputValue, currentFolder]
	);
	const inpDisable = useMemo(
		() => includes(['2', '3', '4', '5', '6'], currentFolder.id),
		[currentFolder]
	);
	const disableSubmit = useMemo(() => showWarning || emptyRtnValue, [showWarning, emptyRtnValue]);

	const onConfirm = useCallback(() => {
		let submit = true;
		if (dsblMsgRet) {
			submit = false;
			if (rtnValue && numberRegex.test(rtnValue)) {
				submit = true;
			} else {
				setEmptyRtnValue(true);
				return;
			}
		}

		if (dsblMsgDis) {
			submit = false;
			if (purgeValue && numberRegex.test(purgeValue)) {
				submit = true;
			} else {
				setEmptyDisValue(true);
				return;
			}
		}
		if (inputValue && submit) {
			let lt = 1;
			let pr = 1;

			if (rtnYear === 'w') lt = rtnValue * 7;
			else if (rtnYear === 'm') lt = rtnValue * 31;
			else if (rtnYear === 'y') lt = rtnValue * 365;
			else lt = rtnValue;

			if (dspYear === 'w') pr = purgeValue * 7;
			else if (dspYear === 'm') pr = purgeValue * 31;
			else if (dspYear === 'y') pr = purgeValue * 365;
			else pr = purgeValue;

			dispatch(
				folderAction({
					folder: currentFolder,
					name: inputValue,
					op: dsblMsgRet || dsblMsgDis ? 'retentionpolicy' : 'update',
					color: folderColor,
					retentionPolicy: {
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
				})
			).then((res) => {
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
		setModal('');
	}, [
		currentFolder,
		dispatch,
		setModal,
		inputValue,
		dsblMsgRet,
		dspYear,
		rtnValue,
		rtnYear,
		purgeValue,
		dsblMsgDis,
		createSnackbar,
		t,
		folderColor
	]);

	return (
		<>
			<ModalHeader
				onClose={onClose}
				title={`${t('label.edit_folder_properties', { name: currentFolder.label })}`}
			/>

			<NameInputRow
				t={t}
				currentFolder={currentFolder}
				showWarning={showWarning}
				setInputValue={setInputValue}
				inputValue={inputValue}
				inpDisable={inpDisable}
				folderColor={folderColor}
				setFolderColor={setFolderColor}
			/>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" padding={{ top: 'medium' }}>
				<FolderDetails t={t} currentFolder={currentFolder} />

				{!isEmpty(currentFolder?.acl) && !currentFolder.owner && (
					<ShareFolderProperties
						folder={currentFolder}
						setCurrentFolder={() => null}
						createSnackbar={createSnackbar}
						folders={allFolders}
						allCalendars={allFolders}
						setModal={setModal}
						totalAppointments={currentFolder.itemsCount}
						setActiveModal={setActiveModal}
					/>
				)}
				<RetentionPolicies
					t={t}
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
				t={t}
				secondaryAction={() => setActiveModal('share')}
				secondaryLabel={t('folder.modal.edit.add_share', 'Add Share')}
				disabled={disableSubmit}
				secondaryBtnType="outlined"
				secondaryColor="primary"
			/>
		</>
	);
};

export default EditDefaultModal;
