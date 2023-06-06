/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container } from '@zextras/carbonio-design-system';
import { FOLDERS, getBridgedFunctions, t } from '@zextras/carbonio-shell-ui';
import { filter, includes, isEmpty } from 'lodash';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import ModalFooter from '../../../../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../../../../carbonio-ui-commons/components/modals/modal-header';
import type { MainEditModalPropType } from '../../../../carbonio-ui-commons/types/sidebar';
import { useAppDispatch } from '../../../../hooks/redux';
import { folderAction } from '../../../../store/actions/folder-action';
import { translatedSystemFolders } from '../../utils';
import { FolderDetails } from './folder-details';
import NameInputRow from './name-input';
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
const numberRegex = /^\d+$/;

const MainEditModal: FC<MainEditModalPropType> = ({ folder, onClose, setActiveModal }) => {
	const dispatch = useAppDispatch();
	const [inputValue, setInputValue] = useState(folder.name);
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
	const [folderColor, setFolderColor] = useState(folder?.color ?? 0);

	useEffect(() => {
		if (
			folder.retentionPolicy &&
			folder.retentionPolicy?.length &&
			folder.retentionPolicy[0].keep !== undefined &&
			folder.retentionPolicy[0].keep &&
			Object.keys(folder.retentionPolicy[0].keep[0]).length !== 0
		) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			const lifetime = folder.retentionPolicy[0]?.keep[0]?.policy[0]?.lifetime;
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
			folder.retentionPolicy &&
			folder.retentionPolicy.length &&
			folder.retentionPolicy[0].purge !== undefined &&
			folder.retentionPolicy[0].purge &&
			Object.keys(folder.retentionPolicy[0].purge[0]).length !== 0
		) {
			const lifetime = folder.retentionPolicy[0]?.purge[0]?.policy[0]?.lifetime;
			const d = parseInt(lifetime, 10);
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
	}, [folder.retentionPolicy]);

	const showWarning = useMemo(
		() =>
			includes(
				filter(translatedSystemFolders, (f) => f !== folder.name),
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
			let lt;
			let pr;

			if (rtnYear === 'w') lt = Number(rtnValue) * 7;
			else if (rtnYear === 'm') lt = Number(rtnValue) * 31;
			else if (rtnYear === 'y') lt = Number(rtnValue) * 365;
			else lt = Number(rtnValue);

			if (dspYear === 'w') pr = Number(purgeValue) * 7;
			else if (dspYear === 'm') pr = Number(purgeValue) * 31;
			else if (dspYear === 'y') pr = Number(purgeValue) * 365;
			else pr = Number(purgeValue);

			folderAction({
				folder: {
					...folder,
					parent: folder.l || '',
					path: folder.absFolderPath,
					absParent: '2',
					children: []
				},
				name: inputValue,
				op: 'update',
				color: Number(folderColor),
				retentionPolicy:
					dsblMsgRet || dsblMsgDis || folder?.retentionPolicy
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
			}).then((res) => {
				if (res.type.includes('fulfilled')) {
					getBridgedFunctions()?.createSnackbar({
						key: `edit`,
						replace: true,
						type: 'info',
						hideButton: true,
						label: t('messages.snackbar.folder_edited', 'Changes correctly saved'),
						autoHideTimeout: 3000
					});
				} else {
					getBridgedFunctions()?.createSnackbar({
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
		folder,
		folderColor
	]);

	const title = t('label.edit_folder_properties', {
		name: folder.name,
		defaultValue: 'Edit {{name}} properties'
	});

	return (
		<>
			<ModalHeader onClose={onClose} title={title} />

			<NameInputRow
				showWarning={showWarning}
				setInputValue={setInputValue}
				inputValue={inputValue}
				inpDisable={inpDisable}
				folderColor={String(folderColor)}
				setFolderColor={setFolderColor}
			/>
			<Container mainAlignment="flex-start" crossAlignment="flex-start" padding={{ top: 'medium' }}>
				<FolderDetails folder={folder} />

				{!isEmpty(folder?.acl) && !folder.owner && (
					<ShareFolderProperties folder={folder} setActiveModal={setActiveModal} />
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

export default MainEditModal;
