/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { ReactElement, useCallback, useMemo, useState } from 'react';

import { ChipInput, ChipItem, Container, Divider, Text } from '@zextras/carbonio-design-system';
import { t, useIntegratedComponent } from '@zextras/carbonio-shell-ui';
import { map, some } from 'lodash';

import ModalFooter from '../carbonio-ui-commons/components/modals/modal-footer';
import ModalHeader from '../carbonio-ui-commons/components/modals/modal-header';
import { TIMEOUTS } from '../constants';
import { useUiUtilities } from '../hooks/use-ui-utilities';
import { redirectMessageAction } from '../store/actions';

type RedirectActionProps = { onClose: () => void; id: string };

type ContactType = {
	company?: string;
	email: string;
	firstName?: string;
	fullName?: string;
	id?: string;
	label?: string;
	lastName?: string;
};

const RedirectMessageAction = ({ onClose, id }: RedirectActionProps): ReactElement => {
	const { createSnackbar } = useUiUtilities();
	const [ContactInput, integrationAvailable] = useIntegratedComponent('contact-input');
	const [contacts, setContacts] = useState<ContactType[]>([]);
	const onChipInputChange = useCallback((items: ChipItem[]) => {
		setContacts(
			items.map<ContactType>(
				(item) =>
					({
						address: item.label,
						email: item.label
					}) as ContactType
			)
		);
	}, []);
	const onContactChange = useCallback((users: ContactType[]) => setContacts(users), []);
	const disableRedirect = useMemo(
		() => contacts?.length === 0 || some(contacts, { error: true }),
		[contacts]
	);

	const onRedirectError = useCallback(() => {
		createSnackbar({
			key: `redirect-${id}`,
			replace: true,
			severity: 'error',
			label: t('label.error_try_again', 'Something went wrong, please try again'),
			autoHideTimeout: TIMEOUTS.REDIRECT
		});
	}, [createSnackbar, id]);

	const onConfirm = useCallback(
		() =>
			redirectMessageAction({
				id,
				e: map(contacts, (p) => ({
					a: p.email,
					t: 't'
				}))
			})
				.then((res) => {
					if (!('Fault' in res)) {
						createSnackbar({
							key: `redirect-${id}`,
							replace: true,
							severity: 'success',
							label: t('messages.snackbar.message_redirected', 'The message has been redirected'),
							autoHideTimeout: TIMEOUTS.REDIRECT
						});
						onClose();
					} else {
						onRedirectError();
					}
				})
				.catch(() => {
					onRedirectError();
				}),
		[contacts, createSnackbar, id, onClose, onRedirectError]
	);

	return (
		<>
			<Container
				padding={{ all: 'large' }}
				mainAlignment="center"
				crossAlignment="flex-start"
				height="fit"
			>
				<ModalHeader onClose={onClose} title={t('header.redirect_email', 'Redirect e-mail')} />
				<Container
					padding={{ top: 'small', bottom: 'small' }}
					mainAlignment="center"
					crossAlignment="flex-start"
					height="fit"
				>
					<Container>
						<Text overflow="break-word">
							<em>
								{t(
									'messages.modal.redirect.first',
									'This e-mail will be sent on to a new recipient while preserving the e-mail address of the original sender.'
								)}
							</em>
						</Text>
						<br />
						<Text overflow="break-word">
							<em>
								{t(
									'messages.modal.redirect.second',
									'The e-mail will appear as originally intended for the new recepient'
								)}
							</em>
						</Text>

						<Container height="fit" padding={{ top: 'medium' }}>
							{integrationAvailable ? (
								<ContactInput
									data-testid={'redirect-recipients-address'}
									// eslint-disable-next-line @typescript-eslint/ban-ts-comment
									// @ts-ignore
									placeholder={t('placeholder.add_new_recipients', 'Add new recipients')}
									onChange={onContactChange}
									defaultValue={contacts}
									disablePortal
								/>
							) : (
								<ChipInput
									data-testid={'redirect-recipients-address'}
									placeholder={t('label.to', 'To')}
									onChange={onChipInputChange}
									defaultValue={contacts}
								/>
							)}
						</Container>
						<Divider color="primary" />
						<ModalFooter
							onConfirm={onConfirm}
							label={t('action.redirect', 'Redirect')}
							disabled={disableRedirect}
						/>
					</Container>
				</Container>
			</Container>
		</>
	);
};
export default RedirectMessageAction;
