/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Prompt, useHistory } from 'react-router-dom';
import { Modal, Padding, Text } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';
import ModalFooter from '../../../../sidebar/commons/modal-footer';

export const RouteLeavingGuard = ({ when, onDeleteDraft }) => {
	const history = useHistory();
	const lastLocationInitial = useMemo(() => history.location.pathname, [history]);
	const [modalVisible, setModalVisible] = useState(false);
	const [lastLocation, setLastLocation] = useState(lastLocationInitial);
	const [confirmedNavigation, setConfirmedNavigation] = useState(false);
	const [t] = useTranslation();

	const onDelete = () => {
		setModalVisible(false);
		onDeleteDraft();
		setConfirmedNavigation(true);
	};

	const onClose = () => {
		setModalVisible(false);
	};

	const onDraft = () => {
		setModalVisible(false);
		setConfirmedNavigation(true);
	};

	const handleBlockedNavigation = (nextLocation) => {
		if (
			!confirmedNavigation &&
			nextLocation.pathname !== (lastLocation?.pathname || lastLocationInitial)
		) {
			setModalVisible(true);
			setLastLocation(nextLocation);
			return false;
		}
		return true;
	};
	useEffect(() => {
		if (confirmedNavigation && lastLocation) {
			// Navigate to the previous blocked location with your navigate function
			history.push(lastLocation.pathname);
		}
	}, [confirmedNavigation, history, lastLocation]);

	return (
		<>
			<Prompt when={when} message={handleBlockedNavigation} />
			{/* Your own alert/dialog/modal component */}
			<Modal
				open={modalVisible}
				title={t('label.before_you_leave', 'Before you leave')}
				showCloseIcon
				onClose={onClose}
				customFooter={
					<ModalFooter
						typeCancel={'outlined'}
						colorCancel={'primary'}
						onConfirm={onDraft}
						label={t('label.keep_draft', 'Keep Draft')}
						secondaryBtnType={'outlined'}
						secondaryAction={onDelete}
						secondaryLabel={t('label.delete_draft', 'Delete Draft')}
						secondaryColor="primary"
						showDivider={false}
						paddingTop="0"
						t={t}
					/>
				}
			>
				<Padding vertical="medium">
					<Text>
						{t('modal.delete_draft.message1', 'Do you want to keep this draft or delete it?')}
					</Text>
				</Padding>
			</Modal>
		</>
	);
};
export default RouteLeavingGuard;
