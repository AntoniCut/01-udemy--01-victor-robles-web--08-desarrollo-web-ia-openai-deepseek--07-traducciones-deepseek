/*
    --------------------------------------------------
    -----  /global.d.ts  --  /types/global.d.ts  -----
    --------------------------------------------------
*/


/// <reference lib="dom" />
/// <reference lib="es2022" />


/**
 * ----------------------------------------------------------------
 * -----  Tipos DOM extendidos para compatibilidad            -----
 * -----  (por si tu versión de lib.dom.d.ts no los incluye)  -----
 * ----------------------------------------------------------------
 */

interface HTMLHeaderElement extends HTMLElement { }
interface HTMLFooterElement extends HTMLElement { }
interface HTMLMainElement extends HTMLElement { }
interface HTMLNavElement extends HTMLElement { }
interface HTMLSectionElement extends HTMLElement { }
interface HTMLArticleElement extends HTMLElement { }
interface HTMLAsideElement extends HTMLElement { }
interface HTMLFigureElement extends HTMLElement { }
interface HTMLFigcaptionElement extends HTMLElement { }


/**
 * -----------------------------------------------
 * -----  Tipos globales para la aplicación  -----
 * -----------------------------------------------
 */

declare global {


    /**  -----  `Cuerpo de la solicitud para la traducción`  ----- */
    interface TraduccionRequest {

        /**  `-----  Texto original a traducir  -----`  */
        text: string

        /**  `-----  Idioma objetivo  -----`  */
        targetLang: string
    }


    /**  -----  `Respuesta de la traducción`  ----- */
    interface TraduccionResponse {

        /**  `-----  Traducción generada  -----`  */
        translation?: string

        /**  `-----  Mensaje de error de la API  -----`  */
        error?: string
    }


    /**  -----  `Prompts construidos para el modelo de traducción`  ----- */
    interface TraduccionPrompts {

        /**  `-----  Prompt del sistema 1: define el rol del modelo  -----`  */
        promptSystem1: string

        /**  `-----  Prompt del sistema 2: restricciones del modelo  -----`  */
        promptSystem2: string

        /**  `-----  Prompt del usuario: texto a traducir  -----`  */
        promptUser: string
    }

}


export { }
