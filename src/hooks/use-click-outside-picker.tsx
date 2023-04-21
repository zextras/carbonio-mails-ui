/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RefObject, useEffect } from 'react';

type StartedWhenMounted = null | boolean | HTMLInputElement;
type StartedInside = null | boolean;

const useClickOutside = (ref: RefObject<HTMLInputElement>, handler: (arg: any) => void): void => {
	useEffect(() => {
		let startedInside: StartedInside = false;
		let startedWhenMounted: StartedWhenMounted = false;

		const listener = (event: any): void => {
			// Do nothing if `mousedown` or `touchstart` started inside ref element
			if (startedInside || !startedWhenMounted) return;
			// Do nothing if clicking ref's element or descendent elements
			if (!ref.current || ref.current.contains(event.target)) return;

			handler(event);
		};

		const validateEventStart = (event: any): void => {
			startedWhenMounted = ref.current;
			startedInside = ref.current && ref.current.contains(event.target);
		};

		document.addEventListener('mousedown', validateEventStart);
		document.addEventListener('touchstart', validateEventStart);
		document.addEventListener('click', listener);

		return (): void => {
			document.removeEventListener('mousedown', validateEventStart);
			document.removeEventListener('touchstart', validateEventStart);
			document.removeEventListener('click', listener);
		};
	}, [ref, handler]);
};

export default useClickOutside;
