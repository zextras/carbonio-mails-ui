/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, useCallback, useState } from 'react';

import { Button, Container, Padding } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import { RecipientsRow } from './recipients-row';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { GapContainer } from '../../../../../commons/gap-container';
import { EditorRecipients, Participant } from '../../../../../types';

export type RecipientsRowsProps = {
	recipients: EditorRecipients;
	onRecipientsChange: (recipients: EditorRecipients) => void;
};

export const RecipientsRows: FC<RecipientsRowsProps> = ({ recipients, onRecipientsChange }) => {
	const [showCc, setShowCc] = useState(recipients.cc.length > 0);
	const [showBcc, setShowBcc] = useState(recipients.bcc.length > 0);

	const toggleCc = useCallback(() => setShowCc((show) => !show), []);
	const toggleBcc = useCallback(() => setShowBcc((show) => !show), []);

	const onToChange = useCallback(
		(updatedRecipients: Array<Participant>) =>
			onRecipientsChange({ ...recipients, to: updatedRecipients }),
		[onRecipientsChange, recipients]
	);

	const onCcChange = useCallback(
		(updatedRecipients: Array<Participant>) =>
			onRecipientsChange({ ...recipients, cc: updatedRecipients }),
		[onRecipientsChange, recipients]
	);

	const onBccChange = useCallback(
		(updatedRecipients: Array<Participant>) =>
			onRecipientsChange({ ...recipients, bcc: updatedRecipients }),
		[onRecipientsChange, recipients]
	);

	return (
		<GapContainer gap={'small'}>
			<Container
				orientation="horizontal"
				background="gray5"
				style={{ overflow: 'hidden' }}
				padding={{ all: 'none' }}
			>
				<Container background="gray5" style={{ overflow: 'hidden' }}>
					<RecipientsRow
						type={ParticipantRole.TO}
						label={t('label.to', 'To')}
						dataTestid={'RecipientTo'}
						recipients={recipients.to}
						onRecipientsChange={onToChange}
					/>
				</Container>
				<Container
					width="fill"
					maxWidth="fit"
					background={'gray5'}
					padding={{ right: 'medium', left: 'extrasmall' }}
					orientation="horizontal"
				>
					<Padding right={'extrasmall'}>
						<Button
							label={t('label.cc', 'Cc')}
							type="ghost"
							style={{ color: '#282828' }} // FIXME create a styled component and use theme colors
							onClick={toggleCc}
							forceActive={showCc}
							data-testid="BtnCc"
						/>
					</Padding>
					<Button
						label={t('label.bcc', 'Bcc')}
						type="ghost"
						style={{ color: '#282828' }} // FIXME create a styled component and use theme colors
						forceActive={showBcc}
						onClick={toggleBcc}
					/>
				</Container>
			</Container>

			{showCc && (
				<RecipientsRow
					type={ParticipantRole.CARBON_COPY}
					label={t('label.cc', 'Cc')}
					dataTestid={'RecipientCc'}
					recipients={recipients.cc}
					onRecipientsChange={onCcChange}
				/>
			)}

			{showBcc && (
				<RecipientsRow
					type={ParticipantRole.BLIND_CARBON_COPY}
					label={t('label.bcc', 'Bcc')}
					dataTestid={'RecipientBcc'}
					recipients={recipients.bcc}
					onRecipientsChange={onBccChange}
				/>
			)}
		</GapContainer>
	);
};
