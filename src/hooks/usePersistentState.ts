import { useEffect, useState } from "react"

/**
 * Persisted version of useState.
 * @param loader  async getter (e.g. repo.getX)
 * @param saver   async setter
 * @param fallback value to use while loading or if storage is empty
 */
export function usePersistentState<T>(
    loader: () => Promise<T>,
    saver: (v: T) => Promise<void>,
    fallback: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
    const [state, setState] = useState<T>(fallback)
    const [loaded, setLoaded] = useState(false)

    // load once
    useEffect(() => {
        loader().then((val) => {
            setState(val)
            setLoaded(true)
        })
    }, [loader])

    // save on every change *after* the initial load
    useEffect(() => {
        if (loaded) {
            saver(state)
        }
    }, [state, loaded, saver])

    return [state, setState, loaded]
}