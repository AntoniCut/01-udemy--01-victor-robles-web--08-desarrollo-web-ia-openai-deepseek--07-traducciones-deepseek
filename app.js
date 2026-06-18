/*
    *  ----------------------------------  *
    *  -----  /app.js  --  /app.js  -----  *
    *  ----------------------------------  *
*/


import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import path from 'path';
import { fileURLToPath } from 'url';


/*
    * ----------------------------------------------------------------
    * -----  Servidor Express para traducciones usando DeepSeek  -----
    * ----------------------------------------------------------------
    * - Sirve frontend estatico.
    * - Expone endpoint POST /api/traducir.
    * - Traduce texto usando un modelo de DeepSeek.
    * ----------------------------------------------------------------
*/


/*
    *  -----------------------------  *
    *  -----  Configuraciones  -----  *
    *  -----------------------------  *  
*/


/**  -----  Configuracion de variables de entorno con dotenv  ----- */
dotenv.config();


/** -----  `Ruta absoluta del archivo actual`  ----- */
const currentFilePath = fileURLToPath(import.meta.url);

/** -----  `Ruta absoluta del directorio actual`  ----- */
const currentDirPath = path.dirname(currentFilePath);

/** -----  `Ruta absoluta del frontend estatico`  ----- */
const publicDirPath = path.join(currentDirPath, 'public');


/**   -----  `Inicializacion de la aplicacion Express`  ----- */
const app = express();

/**  -----  `Puerto del servidor`  ----- */
const PORT = process.env.PORT || 3000;

/** -----  `Ruta base del proyecto`  ----- */
const base = '/victor-robles-web/08-desarrollo-web-ia-openai-deepseek-javascript-nodejs/07-traducciones-deepseek';


/**  -----  `Inicializacion del cliente de DeepSeek`  ----- */
const openai = new OpenAI({
    baseURL: "https://api.deepseek.com",   
    apiKey: process.env.DEEPSEEK_API_KEY    
});



/*
    *  -------------------------  *
    *  -----  Middlewares  -----  *
    *  -------------------------  *
*/


//*  -----  Servir Frontend  --  Archivos estaticos desde la carpeta 'public'  -----
app.use(base, express.static(publicDirPath));

//*  -----  Middleware para parsear JSON -----
app.use(express.json());

//*  -----  Middleware para parsear datos URL-encoded -----
app.use(express.urlencoded({ extended: true }));



/*
    *  ----------------------------------  *
    *  -----  Funciones de negocio  -----  *
    *  ----------------------------------  *
*/


/**
 * -----------------------------------------------
 * -----  `getTranslationDataFromRequest(req)`  -----
 * -----------------------------------------------
 * - Obtiene y normaliza los datos de traduccion desde el body.
 * @param {express.Request} req - Solicitud HTTP de Express
 * @returns {TraduccionRequest} - Datos normalizados para traducir
 */

const getTranslationDataFromRequest = (req) => {

    /** @type {TraduccionRequest} - `Solicitud de traduccion recibida` */
    const body = req.body;

    /**  -----  `Texto ingresado por el usuario a traducir`  ----- */
    const text = body?.text?.trim() || '';

    /**  -----  `Idioma objetivo para la traduccion`  ----- */
    const targetLang = body?.targetLang?.trim() || '';

    /** @type {TraduccionRequest} */
    const traduccion = {
        text,
        targetLang
    };

    //  -----  Retorna el texto y el idioma objetivo normalizados  -----
    return traduccion;

};



/**
 * --------------------------------------------------
 * -----  `validateTranslationData(data, res)`  -----
 * --------------------------------------------------
 * - Valida que text y targetLang existan y no esten vacios.
 * @param {TraduccionRequest} data - Datos a validar
 * @param {express.Response} res - Respuesta HTTP de Express
 * @returns {boolean} - `true` si los datos son validos, `false` en caso contrario
 */

const validateTranslationData = (data, res) => {

    //  -----  Valida que el texto y el idioma objetivo existan y no esten vacios  -----
    if (data.text && data.targetLang)
        return true;

    //  -----  Responde con error 400 si faltan parametros requeridos  -----
    res.status(400).json({
        error: 'Faltan parametros: text o targetLang'
    });

    //  -----  Retorna false para indicar que los datos no son validos  -----
    return false;

};



/**
 * ---------------------------------------------
 * -----  `buildTranslationPrompts(data)`  -----
 * ---------------------------------------------
 * - Construye los prompts para el modelo de traduccion usando los datos de la solicitud.
 * @param {TraduccionRequest} data - Datos de traduccion
 * @returns {TraduccionPrompts} - Prompts construidos para el modelo de traduccion
 * }}
 */

const buildTranslationPrompts = (data) => {

    /** @type {string} - `Prompt del sistema 1: define el rol del modelo` */
    const promptSystem1 =
        'Eres un traductor experto. Traduce el texto dado al idioma objetivo manteniendo el significado original y el tono.';

    /** @type {string} - `Prompt del sistema 2: restricciones del modelo` */
    const promptSystem2 =
        'Solo puedes responder en el idioma objetivo, no en otro idioma. Cualquier otra respuesta o conversacion diferente a la traduccion esta prohibida.';

    /** @type {string} - `Prompt del usuario: texto a traducir` */
    const promptUser = `Traduce el siguiente texto al ${data.targetLang}: ${data.text}`;


    /** @type {TraduccionPrompts} */
    const traduccionPrompts = {
        promptSystem1,
        promptSystem2,
        promptUser
    };

    //  -----  Retorna los prompts construidos  -----
    return traduccionPrompts;

};



/**
 * --------------------------------------------
 * -----  `generateTranslation(prompts)`  -----
 * --------------------------------------------
 * @async
 * - Genera una traduccion usando OpenAI.
 * @param {TraduccionPrompts} prompts - Prompts de traduccion
 * @returns {Promise<string>} - Texto traducido
 */

const generateTranslation = async (prompts) => {

    /**  -----  `Respuesta del modelo openai`  ----- */
    const completion = await openai.chat.completions.create({

        //  -----  `Modelo de OpenAI a usar para la traduccion`  -----
        model: 'deepseek-chat',

        //  -----  `Prompts para guiar la traduccion`  -----
        messages: [

            {
                role: 'system',
                content: prompts.promptSystem1
            },

            {
                role: 'system',
                content: prompts.promptSystem2
            },

            {
                role: 'user',
                content: prompts.promptUser
            }
        ],

        //  -----  `Limite de tokens para la respuesta del modelo`  -----
        max_tokens: 1000,

        //  -----  `Formato de respuesta esperado del modelo`  -----
        response_format: { type: 'text' },

        //  -----  `Control de creatividad de la traduccion`  -----
        temperature: 0.7

    });


    /**  -----  `Texto traducido`  ----- */
    const translatedText = completion?.choices?.[0]?.message?.content?.trim();

    //  -----  Retorna el texto traducido o un mensaje de fallback si no se pudo generar una traduccion valida  -----
    return translatedText || 'No pude traducir el texto en este momento.';

};



/**
 * --------------------------------------------------
 * -----  `handleTranslationError(error, res)`  -----
 * --------------------------------------------------
 * - Maneja errores del endpoint de traduccion.
 * @param {unknown} error - Error lanzado durante la traduccion
 * @param {express.Response} res - Respuesta HTTP de Express
 * @returns {express.Response} - Respuesta HTTP con error formateado
 */

const handleTranslationError = (error, res) => {

    console.error('Error al traducir:', error);

    //  -----  Responde con error 500 si ocurre un error durante la traduccion  -----
    return res.status(500).json({
        error: 'Error al traducir el texto.'
    });

};




/*
    *  -----------------------------------------  *
    *  -----  Endpoint POST /api/traducir  -----  *
    *  -----------------------------------------  *
*/


/**
 * ---------------------------------------------------
 * -----  `handleTranslationRequest(req, res)`  -----
 * --------------------------------------------------
 * - Maneja la solicitud de traduccion: valida, genera respuesta y maneja errores.
 * @async 
 * @param {express.Request} req - La solicitud HTTP de Express
 * @param {express.Response} res - La respuesta HTTP de Express
 * @returns {Promise<void>} - No retorna valor; solo envía la respuesta HTTP
 */

const handleTranslationRequest = async (req, res) => {

    /**  -----  `Contexto de negocio`  -----  */
    const data = getTranslationDataFromRequest(req);

    //  -----  Valida los datos de traduccion y responde con error si no son validos  -----
    if (!validateTranslationData(data, res))
        return;

    //  -----  Intenta generar la traduccion y responde con el resultado o con un error si ocurre un problema  -----
    try {

        /**  -----  `Construye los prompts de traduccion`  -----  */
        const prompts = buildTranslationPrompts(data);

        /**  -----  `Genera la traduccion usando OpenAI y responde con el resultado`  -----  */
        const translation = await generateTranslation(prompts);

        //  -----  Responde con la traduccion generada por el modelo  -----
        res.status(200).json({
            translation
        });

    }

    //  -----  Maneja errores durante la traduccion y responde con un error formateado  -----
    catch (error) {
        handleTranslationError(error, res);
    }

}


//*  -----  Endpoint POST /api/traducir que maneja la solicitud de traduccion usando la funcion handleTranslationRequest  -----
app.post(`${base}/api/traducir`, handleTranslationRequest);



/*
    *  ---------------------------------------------------------------  *
    *  -----  Inicia el servidor HTTP en el puerto especificado  -----  * 
    *  -----  y muestra un mensaje en consola                    -----  *
    *  ---------------------------------------------------------------  *
*/

app.listen(PORT, () => {
    console.log(`✅ Servidor escuchando en http://localhost:${PORT}${base} ✅`);
    
});
